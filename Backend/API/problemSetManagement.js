require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../models/db');


router.post("/getProblemSets", async (req, res) => {
    const {user_id} = req.body;
    const fetch_problemset_query = "SELECT * FROM problem_sets WHERE created_by = ?";
    try {
        const [problem_sets] = await db.query(fetch_problemset_query, [user_id]);
        return res.status(200).json({problem_sets: problem_sets});
    } catch (error) {
        res.status(500).json({message: "Internal Server Error"});
    }
})


module.exports = router