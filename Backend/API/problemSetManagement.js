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


router.post("/SaveUpdatedProblems", async (req, res) => {
    const {update_values} = req.body;
    let success_counter = 0;
    /**
     * Object Structure:
     * {problem_id: {attributes: values}}
     * Each value should be able to place them directly into the query, put the problem_id in the WHERE clause
     */

    const update_statement = "UPDATE problems SET";
    for (const problem_id in update_values) {
        const where_caluse = `WHERE problem_id = ${problem_id}`;
        let key_value_array = [];
        const json_attribute = JSON.parse(update_values[problem_id])
        for (const attribute in json_attribute["attributes"]) {
            if (typeof json_attribute["attributes"][attribute] === "object") {
                const used_value = JSON.stringify(json_attribute["attributes"][attribute]);
                key_value_array.push(`${attribute} = '${used_value}'`);
            } else if (typeof json_attribute["attributes"][attribute] === "string") {
                const used_value = json_attribute["attributes"][attribute]
                key_value_array.push(`${attribute} = "${used_value}"`);
            } else {
                const used_value = json_attribute["attributes"][attribute]
                key_value_array.push(`${attribute} = ${used_value}`);
            }
        }
        const key_value_query = key_value_array.join(", ");
        const entire_update_query = `${update_statement} ${key_value_query} ${where_caluse}`;
        try {
            await db.query(entire_update_query);
            success_counter++;
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Internal Server Error"});
        }        
    }
    res.status(200).json({message: "All problems updated succesfully"});
})


router.post("/DeleteProblems", async (req, res) => {
    const {problemsToBeDeleted} = req.body;
    const deleteQuery = "DELETE FROM problems WHERE problem_id = ?";
    for (let i = 0; i < problemsToBeDeleted.length; i++) {
        try {
            await db.query(deleteQuery, [problemsToBeDeleted[i]]);
        } catch(error) {
            res.status(500).json({message: "Internal Server Error"});
        }
    }
    res.status(200).json({message: "Problems Deleted Successfully"});
})


router.post("/CreateNewProblem", async (req, res) => {
    const {problemsToBeCreated} = req.body;
    const insertQuery = "INSERT INTO problems";

    for (const problem_id in problemsToBeCreated) {
        let attributeLabel = [];
        let attrbuteValue = [];
        const json_attribute = problemsToBeCreated[problem_id]["attributes"];
        for (const attribute in json_attribute) {
            if (attribute !== "problem_id" && attribute !== "is_temp") {
                attributeLabel.push(attribute);
                if (typeof json_attribute[attribute] === "object") {
                    const used_value = json_attribute[attribute];
                    attrbuteValue.push(`'${JSON.stringify(used_value)}'`);
                } else if (typeof json_attribute[attribute] === "string") {
                    const used_value = json_attribute[attribute]
                    attrbuteValue.push(`'${used_value}'`);
                } else {
                    const used_value = json_attribute[attribute]
                    attrbuteValue.push(used_value);
                }
            }
        }
        const labelQuery = `(${attributeLabel.join(", ")})`;
        const valueQuery = `(${attrbuteValue.join(", ")})`;

        const entireInsertQuery = `${insertQuery} ${labelQuery} VALUES ${valueQuery}`;
        try {
            await db.query(entireInsertQuery);
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Internal Server Error"});
        }
    }
    res.status(200).json({message: "Success"});
})


module.exports = router