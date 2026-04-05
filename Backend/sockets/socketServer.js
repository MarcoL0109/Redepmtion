require('dotenv').config();
const { RedisStore } = require('connect-redis');
const redisClient = require("../utils/redis");
const { connect } = require('../API/quizRoomManagement');
const session = require('express-session');
const io = require("socket.io")(parseInt(process.env.REACT_APP_SOCKET_SERVER_PORT), {
    cors: {
        origin: [process.env.REACT_APP_URL]
    }
})
const ROOM_CODE_EXPIRATION_TIME = 7200;


async function constructPlayerList(roomCode) {
    const player_list = await redisClient.hGetAll(`${roomCode}-List`);
    let player_list_names = []
    for (key in player_list) {
        player_list_names.push(player_list[key]);
    }
    return player_list_names
}


io.on("connection", socket => {

    socket.on("join-room", async (data, ack) => {
        const { socketId, roomCode, sessionId, playerName, isLocked } = data;
        const is_lock_state_here = await redisClient.exists(`${roomCode}-Locked`);
        let currentLockState = "0"
        if (!is_lock_state_here) {
            await redisClient.setEx(`${roomCode}-Locked`, ROOM_CODE_EXPIRATION_TIME, isLocked);
        } else {
            currentLockState = await redisClient.get(`${roomCode}-Locked`);
        }
        socket.join(socketId);
        const is_list_here = await redisClient.exists(`${roomCode}-List`);
        const playerIndex = await redisClient.hLen(`${roomCode}-List`) + 1;
        await redisClient.hSet(`${roomCode}-List`, sessionId, playerName);
        await redisClient.hSet(`${roomCode}-Player-Session`, playerIndex, sessionId);
        await redisClient.hSet(`${roomCode}-Session-Player`, sessionId, playerIndex);
        await redisClient.hSet(`${roomCode}-Session-Socket`, sessionId, socket.id);
        if (!is_list_here) {
            await redisClient.expire(`${roomCode}-List`, ROOM_CODE_EXPIRATION_TIME);
            await redisClient.expire(`${roomCode}-Player-Session`, ROOM_CODE_EXPIRATION_TIME);
            await redisClient.expire(`${roomCode}-Session-Socket`, ROOM_CODE_EXPIRATION_TIME);
            await redisClient.expire(`${roomCode}-Session-Player`, ROOM_CODE_EXPIRATION_TIME);
        }
        const player_list_names = await constructPlayerList(roomCode, socketId);
        io.to(socketId).emit("returned-player-list", player_list_names);
        io.to(socketId).emit("init-room-state", Number(currentLockState));
        if (typeof ack === "function") ack(null, player_list_names);
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
            const player_list_names = await constructPlayerList(roomCode);
            io.to(roomSocketId).emit("returned-player-list", player_list_names);
        } else {
            io.to(roomSocketId).emit("room-closed", "Room is closed by the host");
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
})