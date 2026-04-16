require('dotenv').config();
const session = require('express-session');
const {redisClient, subscriber} = require("../utils/redis");
const io = require("socket.io")(parseInt(process.env.REACT_APP_SOCKET_SERVER_PORT), {
    cors: {
        origin: [process.env.REACT_APP_URL]
    }
})
const ROOM_CODE_EXPIRATION_TIME = 7200;
const ROOM_SHADOW_KEYS_EXPIRAION_TIME = 7500;
const PROBLEM_SET_API_URL = process.env.VITE_PROBLEM_SETS_API_URL;
const expirationChannel = '__keyevent@0__:expired';
const activeRoomProblems = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


async function constructPlayerList(roomCode) {
    const player_list = await redisClient.hGetAll(`${roomCode}-List`);
    let player_list_names = []
    for (key in player_list) {
        player_list_names.push(player_list[key]);
    }
    return player_list_names
}


async function constructPlayerOrder(roomCode) {
    const sessionScore = await redisClient.hGetAll(`${roomCode}-Session-Score`);
    const roomHost = await redisClient.get(`${roomCode}-Host`);
    const rankListPromises = Object.keys(sessionScore)
        .filter(sessionId => sessionId !== roomHost)
        .map(async (sessionId) => {
            const username = await redisClient.hGet(`${roomCode}-List`, sessionId);
            const playerIndex = await redisClient.hGet(`${roomCode}-Session-Player`, sessionId);
            return {
                playerIndex: parseInt(playerIndex, 10),
                playerName: username || "Anonymous", 
                playerScore: parseInt(sessionScore[sessionId], 10) || 0,
                sessionId: sessionId,
            };
    });
    let rankList = await Promise.all(rankListPromises);
    rankList.sort((a, b) => b.playerScore - a.playerScore);
    return rankList;
}

// The host should be no be listed in the leaderboard
async function constructRankingList(roomCode) {
    const rankList = await constructPlayerOrder(roomCode);
    let prev = null, fullRankList = {players: []}, rank = 1;
    for (let i = 0; i < rankList.length; i++) {
        const currScore = rankList[i].playerScore;
        if (prev && prev !== currScore) {
            rank++;
        }
        prev = rankList[i].playerScore;
        const { sessionId, ...playerData } = rankList[i];
        const playerRankObject = {
            ...playerData,
            playerRank: rank
        };
        fullRankList.players.push(playerRankObject);
    }
    return fullRankList;
}


async function streamProblems(problemSetId, roomCode) {
    const roomSocketId = await redisClient.get(roomCode);
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
        const problem = problemList[i];
        activeRoomProblems.set(roomCode, problem);
        io.to(roomSocketId).emit("receive-problem", { currProblem: problem });

        await runProblemTimer(problem.time_allowed_in_seconds, "percentage");

        io.to(roomSocketId).emit("display-correct-answer");
        await runProblemTimer(5, "perecentage");

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

                console.log(rankingList);

                const playerSocketId = await redisClient.hGet(`${roomCode}-Session-Socket`, player.sessionId);
                if (playerSocketId) {
                    io.to(playerSocketId).emit("redirect-player-result-page", { playerRank: rank, rankingList: rankingList });
                }
            }

            const roomHostSession = await redisClient.get(`${roomCode}-Host`);
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
        const roomSocketId = await redisClient.get(roomCode);
        io.to(roomSocketId).emit("room-closed", { 
            reason: "Inactivity", 
            message: "Room expired due to 2 hours of inactivity." 
        });

        await Promise.all([
            redisClient.del(`${roomCode}-Player-Session`),
            redisClient.del(`${roomCode}-Session-Socket`),
            redisClient.del(`${roomCode}-Session-Player`),
            redisClient.del(`${roomCode}-Locked`),
            redisClient.del(`${roomCode}`),
            redisClient.del(`${roomCode}-Host`),
            redisClient.del(`${roomCode}-Session-Score`),
        ]);
    }
});


io.on("connection", socket => {

    socket.on("join-room", async (data, ack) => {
        const { socketId, roomCode, sessionId, playerName, isLocked, checkStream, problemSetId } = data;
        const is_lock_state_here = await redisClient.exists(`${roomCode}-Locked`);
        let currentLockState = "0";
        socket.join(socketId);
        let playerIndex = await redisClient.hGet(`${roomCode}-Session-Player`, sessionId);
        if (!playerIndex) {
            const currentPlayerCount = await redisClient.hLen(`${roomCode}-List`) + 1;
            await redisClient.hSet(`${roomCode}-Player-Session`, currentPlayerCount, sessionId);
            await redisClient.hSet(`${roomCode}-Session-Player`, sessionId, currentPlayerCount);
            // I need to make some entries for tracking user answer history
            // And these entries will be used to store in the database
        }
        await redisClient.hSet(`${roomCode}-List`, sessionId, playerName);
        await redisClient.hSet(`${roomCode}-Session-Socket`, sessionId, socket.id);
        await redisClient.hSet(`${roomCode}-Session-Score`, sessionId, 0);
        await redisClient.setEx(`${roomCode}-Status`, ROOM_SHADOW_KEYS_EXPIRAION_TIME, "Pending");
        if (!is_lock_state_here) {
            await redisClient.setEx(`${roomCode}-Locked`, ROOM_SHADOW_KEYS_EXPIRAION_TIME, isLocked);
            await redisClient.setEx(`${roomCode}-Problem-Set`, ROOM_SHADOW_KEYS_EXPIRAION_TIME, problemSetId);
            await redisClient.expire(`${roomCode}-List`, ROOM_CODE_EXPIRATION_TIME);
            await redisClient.expire(`${roomCode}-Player-Session`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Socket`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Player`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Score`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        } else {
            currentLockState = await redisClient.get(`${roomCode}-Locked`);
        }
        const player_list_names = await constructPlayerList(roomCode, socketId);
        io.to(socketId).emit("returned-player-list", player_list_names);
        io.to(socketId).emit("init-room-state", Number(currentLockState));
        if (typeof ack === "function") ack(null, player_list_names);
        if (!checkStream) return
        const currentJoined = await redisClient.incr(`${roomCode}-Joined-Barrier`);
        const totalExpected = await redisClient.hLen(`${roomCode}-Session-Score`);
        if (currentJoined === totalExpected) {
            const started = await redisClient.get(`${roomCode}-Status`);
            if (started === "Pending") {
                await redisClient.set(`${roomCode}-Status`, "Started")
                const problemSetId = await redisClient.get(`${roomCode}-Problem-Set`);
                streamProblems(problemSetId, roomCode);
            }
                
        }
    })


    socket.on("leave-room", async (data) => {
        const { roomCode, isHost, clientSessionId } = data;
        const roomSocketId = await redisClient.get(roomCode);
        const userName = await redisClient.hGet(`${roomCode}-List`, clientSessionId);
        if (!isHost) {
            // Remeber to use the socket id of the host and not the socket id of the current client
            socket.leave(roomSocketId);
            io.to(roomSocketId).emit("log-leave-message", `${userName} has left the room`);
            await redisClient.hDel(`${roomCode}-List`, clientSessionId);
            await redisClient.hDel(`${roomCode}-Session-Socket`, clientSessionId);
            const myPlayerIndex = await redisClient.hGet(`${roomCode}-Session-Player`, clientSessionId);
            await redisClient.hDel(`${roomCode}-Session-Player`, clientSessionId);
            await redisClient.hDel(`${roomCode}-Player-Session`, myPlayerIndex);
            await redisClient.hDel(`${roomCode}-Session-Score`, clientSessionId);
            const player_list_names = await constructPlayerList(roomCode);
            io.to(roomSocketId).emit("returned-player-list", player_list_names);
        } else {
            io.to(roomSocketId).emit("room-closed", {
                reason: "Terminated",
                message: "Room is closed by the host"
            });
            io.in(roomSocketId).socketsLeave(roomSocketId);
            // Remove all room related information stored in the redis
            await Promise.all([
                redisClient.del(`${roomCode}-List`),
                redisClient.del(roomCode),
                redisClient.del(`${roomCode}-Host`),
                redisClient.del(`${roomCode}-Player-Session`),
                redisClient.del(`${roomCode}-Session-Socket`),
                redisClient.del(`${roomCode}-Session-Player`),
                redisClient.del(`${roomCode}-Locked`),
                redisClient.del(`${roomCode}-Session-Score`),
                redisClient.del(`${roomCode}-Joined-Barrier`),
                redisClient.del(`${roomCode}-Problem-Set`),
            ]);
        }
    })

    /**
     * If we want to kick players, 
     * Remove the kicked player from the redis keys of -> roomCode-List, roomCode-Player-Session, roomCode-session-socket
     */
    socket.on("kick-player", async (data) => {
        const { roomCode, playerIndex } = data;
        const playerSession = await redisClient.hGet(`${roomCode}-Player-Session`, playerIndex);
        const targetSocketId = await redisClient.hGet(`${roomCode}-Session-Socket`, playerSession);
        const roomSocketId = await redisClient.get(roomCode);
        const username = await redisClient.hGet(`${roomCode}-List`, playerSession);
        const fetchSocket = await io.in(targetSocketId).fetchSockets();
        const targetSocket = fetchSocket[0];

        await Promise.all([
                redisClient.hDel(`${roomCode}-List`, playerSession),
                redisClient.hDel(`${roomCode}-Player-Session`, playerIndex),
                redisClient.hDel(`${roomCode}-Session-Socket`, playerSession),
                redisClient.hDel(`${roomCode}-Session-Score`, playerSession),
            ]);
        io.to(targetSocketId).emit("kick-player-message", `${username} is kicked by host`);
        const player_list_names = await constructPlayerList(roomCode, roomSocketId);
        io.to(roomSocketId).emit("returned-player-list", player_list_names);
        targetSocket.leave(roomSocketId);
    })


    socket.on("set-lock-state", async (data) => {
        const { roomCode, isLock } = data;
        await redisClient.set(`${roomCode}-Locked`, isLock);
    })


    socket.on("initialize-room-start", async (data) => {
        const {roomCode} = data;
        const roomSocketId = await redisClient.get(roomCode);

        await redisClient.expire(`${roomCode}-Locked`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        await redisClient.expire(`${roomCode}-List`, ROOM_CODE_EXPIRATION_TIME);
        await redisClient.expire(`${roomCode}-Player-Session`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        await redisClient.expire(`${roomCode}-Session-Socket`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        await redisClient.expire(`${roomCode}-Session-Player`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        await redisClient.expire(`${roomCode}-Host`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        await redisClient.expire(`${roomCode}`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        await redisClient.expire(`${roomCode}-Session-Score`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        await redisClient.expire(`${roomCode}-Joined-Barrier`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        await redisClient.expire(`${roomCode}-Problem-Set`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);

        io.to(roomSocketId).emit("redirect-room-members");
    })



    socket.on("submit-client-answer", async (data) => {
        // Need to fix this. THe time state is no longer in the frontend anymore. So the timeSubmitted is always going to be the time allowed for the problem
        const {question_type, clientAnswer, roomCode, timeSubmitted, sessionId} = data;
        const currProblem = activeRoomProblems.get(roomCode);
        const correctAnswer = question_type === "MC" ? currProblem.correct_answer.MC : currProblem.correct_answer.Blanks;
        const isCaseSensitive = currProblem.case_sensitive;
        let isCorrectAnswer = false;
        if (isCaseSensitive) {
            isCorrectAnswer = correctAnswer === clientAnswer;
        } else {
            const lowerCaseCorrectAnswer = correctAnswer.toLowerCase();
            const lowerCaseClientAnswer = clientAnswer.toLowerCase();
            isCorrectAnswer = lowerCaseClientAnswer === lowerCaseCorrectAnswer;
        }
        let returnScore = (await redisClient.hGet(`${roomCode}-Session-Score`, sessionId)) ?? 0;
        returnScore = parseInt(returnScore, 10);
        returnScore += (isCorrectAnswer ? 100 : 0);
        if (isCorrectAnswer === true) {
            const scoreForTime = 100 * (timeSubmitted / 100);
            returnScore += scoreForTime;
        }
        await redisClient.hSet(`${roomCode}-Session-Score`, sessionId, returnScore);
        io.to(socket.id).emit("check-answer-response", {
            correct: isCorrectAnswer,
            score: returnScore,
        });
    })


    socket.on("init-game-info", async (data) => {
        const {roomCode, sessionId} = data;
        const rankingList = await constructRankingList(roomCode);
        const playerIndex = await redisClient.hGet(`${roomCode}-Session-Player`, sessionId);
        io.to(socket.id).emit("set-ranklist-ref", {rankList: rankingList});
        io.to(socket.id).emit("set-player-index", {playerIndex: parseInt(playerIndex, 10)});
    })

})