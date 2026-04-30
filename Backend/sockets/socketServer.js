// TODO: Break this file in to other sub-file to "un-god" this object -> modulize this file...
require('dotenv').config();
const {redisClient, subscriber} = require("../utils/redis");
const io = require("socket.io")(parseInt(process.env.REACT_APP_SOCKET_SERVER_PORT), {
    cors: {
        origin: [process.env.REACT_APP_URL]
    }
})
const {constructPlayerList, constructRankingList, constructPlayerOrder} = require("../utils/gameUtils");
const {activeRoomProblems, problemStartTime} = require("../utils/gameStates");
const roomHandlerSocket = require("../sockets/roomHandlerSocket")(io, redisClient);
const gameHandlerSocket = require("../sockets/gameHandlerSocket")(io, redisClient);
console.log("✅ Socket server starts listening from port", parseInt(process.env.REACT_APP_SOCKET_SERVER_PORT));
const ROOM_CODE_EXPIRATION_TIME = 7200;
const ROOM_SHADOW_KEYS_EXPIRAION_TIME = 7500;
const PROBLEM_SET_API_URL = process.env.VITE_PROBLEM_SETS_API_URL;
const expirationChannel = '__keyevent@0__:expired';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


async function streamProblems(problemSetId, roomCode) {
    const roomSocketId = await redisClient.hGet(roomCode, "SocketId");
    const fetch_problem_list_response = await fetch(`${PROBLEM_SET_API_URL}/getProblems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ problem_set_id: problemSetId }),
    });

    if (fetch_problem_list_response.status === 500) return;

    const problemListJson = await fetch_problem_list_response.json();
    const problemList = problemListJson.problem_list;

    const runProblemTimer = (seconds, mode) => {
        return new Promise((resolve) => {
            let secondsLeft = seconds;
            if (mode === "percentage") {
                io.to(roomSocketId).emit("receive-timer-update", { 
                    timeAllowed: seconds
                });
            }
            const interval = setInterval(() => {
                if (mode === 'actual') {
                    io.to(roomSocketId).emit("receive-count-down-update", { 
                        secondsLeft: secondsLeft
                    });
                }
                if (secondsLeft <= 0) {
                    clearInterval(interval);
                    resolve(); 
                }
                secondsLeft--;
            }, 1000);
        });
    };

    await runProblemTimer(3, "actual");
    for (let i = 0; i < problemList.length; i++) {

        const roomExists = await redisClient.exists(roomCode);
        if (!roomExists) {
            console.log(`Stream stopped for ${roomCode}: Room terminated.`);
            return;
        }
        const problem = problemList[i];
        activeRoomProblems.set(roomCode, problem);
        io.to(roomSocketId).emit("receive-problem", { currProblem: problem });

        problemStartTime.set(roomCode, Date.now());
        await runProblemTimer(problem.time_allowed_in_seconds, "percentage");

        io.to(roomSocketId).emit("display-correct-answer");
        await runProblemTimer(5, "percentage");

        const currProblemId = problem.problem_id;
        const allProgress = await redisClient.hGetAll(`${roomCode}-Session-Last-Problem-Answered`);
        const hostSession = await redisClient.hGet(roomCode, "Host");
        for (const sessionId in allProgress) {
            if (allProgress[sessionId] !== String(currProblemId) && sessionId !== hostSession) {
                await redisClient.hSet(`${sessionId}-${roomCode}-Answer-History`, currProblemId, "TIMEOUT_NULL");
            }
        }

        if (i + 1 < problemList.length) {
            const rankingList = await constructRankingList(roomCode);
            io.to(roomSocketId).emit("receive-rank-list", { rankList: rankingList });
            await sleep(5000); 
        } else {
            const finalRankList = await constructPlayerOrder(roomCode);
            const rankingList = await constructRankingList(roomCode);
            let prev = null, rank = 1;

            for (let j = 0; j < finalRankList.length; j++) {
                const player = finalRankList[j];
                if (prev !== null && prev !== player.playerScore) {
                    rank++;
                }
                prev = player.playerScore;
                const playerSocketId = await redisClient.hGet(`${roomCode}-Session-Socket`, player.sessionId);
                if (playerSocketId) {
                    io.to(playerSocketId).emit("redirect-player-result-page", { playerRank: rank, rankingList: rankingList });
                }
            }

            const roomHostSession = await redisClient.hGet(roomCode, "Host");
            const roomHostSocket = await redisClient.hGet(`${roomCode}-Session-Socket`, roomHostSession);
            if (roomHostSocket) {
                io.to(roomHostSocket).emit("redirect-player-result-page", { playerRank: -1, rankingList: rankingList });
            }
        }                   
    }
}


subscriber.subscribe(expirationChannel, async (message) => {
    if (message.endsWith("-List")) {
        const roomCode = message.replace("-List", "");
        const roomSocketId = await redisClient.hGet(roomCode, "SocketId");
        io.to(roomSocketId).emit("room-closed", { 
            reason: "Inactivity", 
            message: "Room expired due to 2 hours of inactivity." 
        });
        await Promise.all([
            redisClient.del(`${roomCode}-Player-Session`),
            redisClient.del(`${roomCode}-Session-Socket`),
            redisClient.del(`${roomCode}`),
            redisClient.del(`${roomCode}-Session-Score`),
            redisClient.del(`${roomCode}-Joined-Barrier`),
            redisClient.del(`${roomCode}-Last-Problem-Answered`),
        ]);
        const allSession = await redisClient.hGetAll(`${roomCode}-Session-Player`);
        for (const sessionId in allSession) {
            await redisClient.del(`${sessionId}-${roomCode}-Answer-History`);
        }
        await redisClient.del(`${roomCode}-Session-Player`);
    }
});


io.on("connection", socket => {

    socket.on("join-room", async (data, ack) => {
        const { socketId, roomCode, sessionId, playerName, isLocked, checkStream, problemSetId } = data;
        const is_lock_state_here = await redisClient.hExists(roomCode, "IsLocked");
        let currentLockState = "0";
        socket.join(socketId);
        let playerIndex = await redisClient.hGet(`${roomCode}-Session-Player`, sessionId);
        if (!playerIndex) {
            const currentPlayerCount = await redisClient.hLen(`${roomCode}-List`) + 1;
            await redisClient.hSet(`${roomCode}-Player-Session`, currentPlayerCount, sessionId);
            await redisClient.hSet(`${roomCode}-Session-Player`, sessionId, currentPlayerCount);
        }
        await redisClient.hSet(`${roomCode}-List`, sessionId, playerName);
        await redisClient.hSet(`${roomCode}-Session-Socket`, sessionId, socket.id);
        await redisClient.hSet(`${roomCode}-Session-Score`, sessionId, 0);
        await redisClient.hSet(`${roomCode}-Session-Last-Problem-Answered`, sessionId, -1);
        await redisClient.hSet(roomCode, "Status", "Pending");
        if (!is_lock_state_here) {
            await redisClient.hSet(roomCode, "IsLocked", isLocked);
            await redisClient.hSet(roomCode, "ProblemSetId", problemSetId);
            await redisClient.expire(`${roomCode}-List`, ROOM_CODE_EXPIRATION_TIME);
            await redisClient.expire(`${roomCode}-Player-Session`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Socket`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Player`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Score`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Last-Problem-Answered`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        } else {
            currentLockState = await redisClient.hGet(roomCode, "IsLocked");
        }
        const player_list_names = await constructPlayerList(roomCode, socketId);
        io.to(socketId).emit("returned-player-list", player_list_names);
        io.to(socketId).emit("init-room-state", Number(currentLockState));
        if (typeof ack === "function") ack(null, player_list_names);
        if (!checkStream) return
        const currentJoined = await redisClient.incr(`${roomCode}-Joined-Barrier`);
        // Remove manually after the room ends to prevent memory leak
        const totalExpected = await redisClient.hLen(`${roomCode}-Session-Score`);
        if (currentJoined === totalExpected) {
            const started = await redisClient.hGet(roomCode, "Status");
            if (started === "Pending") {
                await redisClient.hSet(roomCode, "Status", "Started")
                await redisClient.hSet(roomCode, "GameStartTime", Date.now());
                const problemSetId = await redisClient.hGet(roomCode, "ProblemSetId");
                streamProblems(problemSetId, roomCode);
            }
        }
    })

    // Sokcet listeners
    socket.on("leave-room", async (data) => {roomHandlerSocket.handleLeaveRoom(data)});
    socket.on("set-lock-state", async (data) => {roomHandlerSocket.handleSetLockState(data)});
    socket.on("initialize-room-start", async (data) => {roomHandlerSocket.handleInitRoomStart(data)});
    socket.on("kick-player", async (data) => {gameHandlerSocket.handleKickPlayer(data)});
    socket.on("submit-client-answer", async (data, socket_id) => {gameHandlerSocket.handleSubmitClientAnswer(data, socket.id)});
    socket.on("init-game-info", async (data, socket_id) => {gameHandlerSocket.handleInitGameInfo(data, socket.id)});


    socket.on("request-player-answer-history", async (data) => {
        const {sessionId, roomCode} = data;
        const clientAnswerHistory = await redisClient.hGetAll(`${sessionId}-${roomCode}-Answer-History`);
        io.to(socket.id).emit("receive-player-answer-history", {answerHistory: clientAnswerHistory});
    })

})