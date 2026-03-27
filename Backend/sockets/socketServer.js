require('dotenv').config();
const redisClient = require("../utils/redis");
const io = require("socket.io")(parseInt(process.env.REACT_APP_SOCKET_SERVER_PORT), {
    cors: {
        origin: [process.env.REACT_APP_URL]
    }
})
const ROOM_CODE_EXPIRATION_TIME = 7200;

io.on("connection", socket => {
    socket.on("join-room", async (data, ack) => {
        const { socketId, roomCode, sessionId, playerName } = data;
        socket.join(socketId);
        await redisClient.hSet(`${roomCode}-List`, sessionId, playerName);
        await redisClient.expire(`${roomCode}-List`, ROOM_CODE_EXPIRATION_TIME);
        const player_list = await redisClient.hGetAll(`${roomCode}-List`);
        let player_list_names = []
        for (key in player_list) {
            player_list_names.push(player_list[key]);
        }
        socket.to(socketId).emit("returned-player-list", player_list_names);
        if (typeof ack === "function") ack(null, player_list_names);
    })
})