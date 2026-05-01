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
const expirationChannel = '__keyevent@0__:expired';



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

    // Sokcet listeners
    socket.on("join-room", async (data, ack) => {roomHandlerSocket.handleJoinRoom(data, ack, socket)});
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