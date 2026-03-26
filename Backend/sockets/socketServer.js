require('dotenv').config();
const redisClient = require("../utils/redis");
const io = require("socket.io")(parseInt(process.env.REACT_APP_SOCKET_SERVER_PORT), {
    cors: {
        origin: [process.env.REACT_APP_URL]
    }
})
const ROOM_CODE_EXPIRATION_TIME = 7200;

io.on("connection", socket => {
    socket.on("join-room", async (socket_id, room_code, session_id, player_name) => {
        socket.join(socket_id);
        await redisClient.hSet(`${room_code}-List`, session_id, player_name);
        await redisClient.expire(`${room_code}-List`, ROOM_CODE_EXPIRATION_TIME);
        const player_list = await redisClient.hGetAll(`${room_code}-List`);
        let player_list_names = []
        for (key in player_list) {
            player_list_names.push(player_list[key]);
        }
        io.to(socket_id).emit("returned-player-list", player_list_names)
    })
})