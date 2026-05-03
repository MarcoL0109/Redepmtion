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
    const fetch_problem_query = "SELECT * FROM problems WHERE problem_set_id = ? ORDER BY sequence_no";
    try {
        const [problems] = await db.query(fetch_problem_query, [problem_set_id]);
        return res.status(200).json({problem_list: problems});
    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"});
    }
})


router.post("/UpdateWriteTime", async (req, res) => {
    const {problem_set_id} = req.body;
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 19).replace('T', ' ');
    const updateWritTimeQuery = `UPDATE problem_sets SET last_update_at = '${localISOTime}' WHERE problem_set_id = ${problem_set_id}`;

    try {
        await db.query(updateWritTimeQuery);
        res.status(200).json({message: "Write Time Updated Successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal Server Error"});
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
                let used_value = JSON.stringify(json_attribute["attributes"][attribute]);
                used_value = used_value.replace(/'/g, "''");
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
                    let cleaned_used_value = JSON.stringify(used_value)
                    cleaned_used_value = cleaned_used_value.replace(/'/g, "''");
                    attrbuteValue.push(`'${cleaned_used_value}'`);
                } else if (typeof json_attribute[attribute] === "string") {
                    const used_value = json_attribute[attribute]
                    attrbuteValue.push(`"${used_value}"`);
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


router.post("/UpdateProblemSets", async (req, res) => {
    const problem_set_change_mapping = req.body.problemSetModMap;
    const update_statement = `UPDATE problem_sets SET`
    for (const problem_set_id in problem_set_change_mapping) {
        const nums_problem_set_id = Number(problem_set_id);
        const where_statement = `WHERE problem_set_id = ${nums_problem_set_id}`;
        let key_value_pair_list = []
        for (const key in problem_set_change_mapping[nums_problem_set_id]["attributes"]) {
            const curr_pair = `${key} = "${problem_set_change_mapping[nums_problem_set_id]["attributes"][key]}"`
            key_value_pair_list.push(curr_pair);
        }
        const update_values_statement = key_value_pair_list.join(", ");
        const entire_update_query = `${update_statement} ${update_values_statement} ${where_statement}`
        try {
            await db.query(entire_update_query);
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Internal Sever Error"});
        }
    }
    res.status(200).json({message: "All problem set updated"});
})


router.post("/CreateNewProblemSet", async (req, res) => {
    const problems_to_be_created = req.body.potentialCreateProblemSet;
    const insert_statement = "INSERT INTO problem_sets"
    for (const problem_id in problems_to_be_created) {
        let key_list = [], value_list = [];
        const attributes = problems_to_be_created[problem_id]['attributes'];
        for (const attribute in attributes) {
            if (attribute != "problem_set_id" && attribute != "is_temp") {
                key_list.push(attribute);
                const use_val = typeof problems_to_be_created[problem_id]['attributes'][attribute] === "string" ? 
                `"${problems_to_be_created[problem_id]['attributes'][attribute]}"` :
                `${problems_to_be_created[problem_id]['attributes'][attribute]}`
                value_list.push(use_val);

            }
        }
        const joined_keys = `(${key_list.join(", ")})`;
        const joined_values = `(${value_list.join(", ")})`;
        const entire_insert_statement = `${insert_statement} ${joined_keys} VALUES ${joined_values}`;
        try {
            await db.query(entire_insert_statement);
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Internal Server Error"});
        }
    }
    res.status(200).json({message: "Problem Sets Created Successfully"});
})


router.post("/DeleteProblemSets", async (req, res) => {
    const problems_to_be_deleted = req.body.potentialDeleteList;
    for (let i = 0; i < problems_to_be_deleted.length; i++) {
        const nums_problem_set_id = Number(problems_to_be_deleted[i]);
        try {
            await db.query("DELETE FROM problem_sets WHERE problem_set_id = ?", [nums_problem_set_id]);
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Internal Server Error"});
        }
    }
    res.status(200).json({message: "Problems Deleted Suuccefully"});
})


module.exports = router