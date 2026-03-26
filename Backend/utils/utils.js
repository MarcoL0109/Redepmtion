require('dotenv').config();
const express = require('express');
const router = express.Router();
const fs = require('fs');
const db = require('../models/db')


router.get("/SessionInfo", (req, res) => {
    return res.json({session: req.session, sessionID: req.sessionID})
})


router.post("/InsertImage", (req, res) => {
    fs.readFile("./Frontend/src/assets/test.jpg", (err, data) => {
        if (err) throw err;

        const sqlInsert = 'UPDATE user_info SET user_icon = ? WHERE user_id = 4';
        db.query(sqlInsert, [data]);
        console.log("image inerted!");
    });
})

module.exports = router;