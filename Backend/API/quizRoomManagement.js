const express = require('express');
const router = express.Router();
const {redisClient, subscriber} = require("../utils/redis");
const ROOM_SHADOW_KEYS_EXPIRAION_TIME = 7500;


router.get("/getRoomCode", async (req, res) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let room_code = '', exists = 1;
    while (room_code === '' || exists === 1) {
        for (let i = 0; i < 6; i++) {
            room_code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        exists = await redisClient.keys(room_code);
    }
    return res.json({ code: room_code });
})


router.post("/storeRoomCodeSocketId", async (req, res) => {
    const room_code = req.body.room_code;
    const socket_id = req.body.socket_id;
    const session_id = req.body.session_id;
    const is_here = await redisClient.exists(room_code);

    if (is_here === 0) {
        try {
            await redisClient.hSet(room_code, "SocketId", socket_id);
            await redisClient.hSet(room_code, "Host", session_id);
            await redisClient.hSet(room_code, "RoomStartTime", Date.now());
            await redisClient.expire(room_code, ROOM_SHADOW_KEYS_EXPIRAION_TIME);
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Internal Server Error"});
        }
    }
    res.status(200).json({message: "Room Code Stored in Redis"});
})


router.post("/getRoomSocketID", async (req, res) => {
    const room_code = req.body.room_code;
    try {
        const socket_id = await redisClient.hGet(room_code, "SocketId");
        res.status(200).json({socket_id: socket_id});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal Server Error"});
    }
})


router.post("/checkRoomCodeExist", async (req, res) => {
    const {roomCode} = req.body;
    const is_room_exist = await redisClient.exists(roomCode);
    if (is_room_exist === 0) {
        res.status(404).json({message: "Room with such code is not found"});
    } else {
        const isLocked = await redisClient.hGet(roomCode, "IsLocked");
        if (isLocked === "0") {
            res.status(200).json({message: "Room Found"});
        } else {
            res.status(401).json({message: "Room is Locked by the Host"});
        }
    }
})


router.post("/getRoomHost", async (req, res) => {
    const room_code = req.body.room_code;
    const received_session_id = req.body.session_id;
    try {
        const host_session_id = await redisClient.hGet(room_code, "Host");
        const is_host = host_session_id === received_session_id;
        res.status(200).json({is_host: is_host});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal Server Error"});
    }
})


module.exports = router