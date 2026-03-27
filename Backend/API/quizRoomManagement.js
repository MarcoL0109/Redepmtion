const express = require('express');
const router = express.Router();
const redisClient = require("../utils/redis");
const ROOM_CODE_EXPIRATION_TIME = 7200;


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
    const is_here = await redisClient.exists(room_code);

    if (is_here === 0) {
        try {
            await redisClient.setEx(room_code, ROOM_CODE_EXPIRATION_TIME, socket_id);
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
        const socket_id = await redisClient.get(room_code);
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
        res.status(200).json({message: "Room Found"});
    }
})


module.exports = router