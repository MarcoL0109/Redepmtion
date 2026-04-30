
const ROOM_CODE_EXPIRATION_TIME = 7200;
const ROOM_SHADOW_KEYS_EXPIRAION_TIME = 7500;
const {activeRoomProblems, problemStartTime} = require("../utils/gameStates")


module.exports = function(io, redisClient) {
    return {

        handleLeaveRoom: async (data) => {
            const { roomCode, isHost, clientSessionId } = data;
            const roomSocketId = await redisClient.hGet(roomCode, "SocketId");
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
                await redisClient.hDel(`${roomCode}-Last-Problem-Answered`, clientSessionId);
                await redisClient.del(`${clientSessionId}-Answer-History`);
                const player_list_names = await constructPlayerList(roomCode);
                io.to(roomSocketId).emit("returned-player-list", player_list_names);
            } else {
                io.to(roomSocketId).emit("room-closed", {
                    reason: "Terminated",
                    message: "Room is closed by the host"
                });
                io.in(roomSocketId).socketsLeave(roomSocketId);
                // Remove all room related information stored in the redis
                activeRoomProblems.delete(roomCode);
                problemStartTime.delete(roomCode);
                await Promise.all([
                    redisClient.del(`${roomCode}-List`),
                    redisClient.del(roomCode),
                    redisClient.del(`${roomCode}-Player-Session`),
                    redisClient.del(`${roomCode}-Session-Socket`),
                    redisClient.del(`${roomCode}-Session-Score`),
                    redisClient.del(`${roomCode}-Joined-Barrier`),
                    redisClient.del(`${roomCode}-Session-Answer-History`),
                    redisClient.del(`${roomCode}-Last-Problem-Answered`),
                ]);
                const allSession = await redisClient.hGetAll(`${roomCode}-Session-Player`);
                for (const sessionId in allSession) {
                    await redisClient.del(`${sessionId}-${roomCode}-Answer-History`);
                }
                await redisClient.del(`${roomCode}-Session-Player`);
            }
        },


        handleSetLockState: async (data) => {
            const { roomCode, isLock } = data;
            await redisClient.hSet(roomCode, "IsLocked", isLock);
        },


        handleInitRoomStart: async (data) => {
            const {roomCode} = data;
            const roomSocketId = await redisClient.hGet(roomCode, "SocketId");
            await redisClient.expire(`${roomCode}-List`, ROOM_CODE_EXPIRATION_TIME);
            await redisClient.expire(`${roomCode}-Player-Session`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Socket`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Player`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Session-Score`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            await redisClient.expire(`${roomCode}-Joined-Barrier`, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
            io.to(roomSocketId).emit("redirect-room-members");
        }
    }
}