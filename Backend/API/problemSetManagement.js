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


router.post("/getProblems", async (req, res) => {
    const {problem_set_id} = req.body;
    const fetch_problem_query = "SELECT * FROM problems WHERE problem_set_id = ?";
    try {
        const [problems] = await db.query(fetch_problem_query, [problem_set_id]);
        return res.status(200).json({problem_list: problems});
    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"});
    }

})


module.exports = router