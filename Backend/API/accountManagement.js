require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require("nodemailer")
const {encrypt_object, decrypt_object} = require("../security_utils/encryption")
const idempotencyGuard = require('../middleware/idempotency');
const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.REACT_APP_NODEMAILERAUTHOR,
        pass: process.env.REACT_APP_NODEMAILERPASSWORD,
    },
    from: process.env.REACT_APP_NODEMAILERAUTHOR
})


router.post("/login", idempotencyGuard,  async (req, res) => {
    try {
        const {email, password } = req.body;
        const search_from_email_query = "SELECT * FROM user_info WHERE email = ?";
        const [ result ] = await db.query(search_from_email_query, [email]);
        if (result.length === 0) {
            return res.status(404).json({ message: "User Not Found" });
        }
        const hashed_password = result[0].password;
        const correct_password = await bcrypt.compare(password, hashed_password);
        const is_activated = result[0].activated;

        if (!correct_password) {return res.status(401).json({ message: "Password Incorrect" })}
        else if (!is_activated) {return res.status(400).json({message: "Account Not Activated"})}
        else {
            req.session.user_id = result[0].user_id;
            return res.status(200).json({ message: "Login successfully" });
        }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
})


router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
            res.status(500).json({message: "Internal Server Error"})
        } else {
            res.clearCookie("'connect.sid'");
            res.status(200).json({message: "Logout Successfully"})
        }
    })
})


router.post("/createUsers", async (req, res) => {
    try {
        const { email, username, confirmPassword } = req.body;
        const search_from_email_query = "SELECT user_id, activated FROM user_info WHERE email = ?";
        let update_user = false;
        let new_user_id = -1;
        const [ result ] = await db.query(search_from_email_query, [email]);
        if (result.length > 0) {
            if (result[0].activated) {
                return res.status(401).json({ message: "An Activated Account Already Existed" });
            } else {
                update_user = true;
                new_user_id = result[0].user_id;
            }
        }
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 30 * 60 * 1000);
        const hashed_password = await bcrypt.hash(confirmPassword, 10);
        if (!update_user) {
            const create_user_query = "INSERT INTO user_info (username, email, password, activated, activation_expiration_datetime) VALUES (?, ?, ?, ?, ?)";
            const inserted_user = await db.query(create_user_query, [username, email, hashed_password, 0, tomorrow]);
            new_user_id = inserted_user[0].insertId;
        } else {
            const update_existing_user_query = "UPDATE user_info SET username = ?, password = ?, activation_expiration_datetime = ? WHERE email = ?";
            await db.query(update_existing_user_query, [username, hashed_password, tomorrow, email]);
        }
        
        const validationKey = uuidv4();
        const activation_data = {user_id: new_user_id, key: validationKey}
        const encrypted_object = encrypt_object(activation_data, process.env.REACT_APP_ACTIVATION_ENCRYPTION_KEY);
        const encrypt_object_for_url = encodeURIComponent(JSON.stringify(encrypted_object));
        const activation_url = `${process.env.VITE_USER_API_URL}/activation?data=${encrypt_object_for_url}`;
        const insert_activation_record_query = "INSERT INTO activations (user_id, activation_code, expiration_datetime) VALUES (?, ?, ?)";
        await db.query(insert_activation_record_query, [new_user_id, validationKey, tomorrow]);
        const mailOptaion = {
            from: 'marcolau733@gmail.com',
            to: email,
            subject: 'Activating new registered account',
            html: `
                <h1>Account Activation</h1>
                <p>Click the following link to activate your account. This link will be expired after 1 hour</p>
                <a href="${activation_url}">Click here</a>
            `
        }
        await transport.sendMail(mailOptaion);
        return res.status(200).json({ message: "User created successfully" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: error});
    } 
});


router.get("/activation", async (req, res) => {
    const encrypted_data_object = req.query;
    const encrypted_object_json = JSON.parse(encrypted_data_object.data)
    const decrypted_object = decrypt_object(encrypted_object_json, process.env.REACT_APP_ACTIVATION_ENCRYPTION_KEY);

    const search_for_activation_record_query = "SELECT activation_record_id FROM activations WHERE user_id = ? AND activation_code = ? AND now() < expiration_datetime";
    const [activation_record] = await db.query(search_for_activation_record_query, [decrypted_object.user_id, decrypted_object.key]);

    if (activation_record.length === 0) {
        res.status(401).json({message: "This link is no longer valid. Please register for another in the sign up page"});
    } else {
        const activate_user_account_query = "UPDATE user_info SET activated = 1 WHERE user_id = ?";
        await db.query(activate_user_account_query, [decrypted_object.user_id]);
        res.status(200).json({message: "Account activated successfully"});
    }
})


router.post("/forgotPassword", async (req, res) => {
    const { email } = req.body;
    const search_users_with_email_query = "SELECT username from user_info where email = ?";
    const [ result ] = await db.query(search_users_with_email_query, [email]);
    if (result.length === 0) {
        return res.status(401).json({ message: "User not found" });
    }
    const username = result[0].username;
    const validation_code_length = 6;
    let validation_code = "";

    function random_number(max) {
        return Math.floor(Math.random() * max);
    }
    
    async function generate_code() {
        for (let i = 0; i < validation_code_length; i++) {
            validation_code += random_number(10);
        }
        return validation_code;
    }

    let is_here = true;
    const find_existing_validation_code_query = "SELECT id FROM password_resets WHERE validation_code = ?";
    let reset_code;
    let expiration_date = new Date();
    expiration_date.setMinutes(expiration_date.getMinutes() + 10);

    while (is_here) {
        reset_code = await generate_code();
        const [result] = await db.query(find_existing_validation_code_query, reset_code);
        is_here = (result.length > 0);
    }

    const [existingCode] = await db.query(
        "SELECT * FROM password_resets WHERE email = ?",
        [email]
    );

    if (existingCode.length > 0) {
        await db.query(
            "UPDATE password_resets SET validation_code = ?, expiration = ? WHERE email = ?",
            [reset_code, expiration_date, email]
        )
    }
    else {
        const insert_password_reset_record_query = "INSERT INTO password_resets (email, expiration, validation_code) VALUES (?, ?, ?)";
        await db.query(insert_password_reset_record_query, [email, expiration_date, reset_code]);
    }

    const content = `Hi ${username}.\nYour code for restting your password is ${validation_code}\nValidation code is valid within 10 minutes`;
    const mailOptaion = {
        from: 'marcolau733@gmail.com',
        to: email,
        subject: 'Validation code for restting password',
        text: content
    }

    transport.sendMail(mailOptaion, function(error, info) {
        if (error) {
            return res.status(500).json({ message: "Send Mail error" });
        }
        else {
            return res.status(200).json({ message: "Email sent successfully" });
        }
    });
})


router.post("/ValidateCode", async (req, res) => {
    async function formatDateToMySQL(date) {
        const pad = (num) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
    const { email, validationCode } = req.body;
    const [ result ] = await db.query("SELECT validation_code FROM password_resets WHERE email = ? AND expiration > ?", [email, await formatDateToMySQL(new Date())]);

    if (result.length === 0 || result[0].validation_code !== validationCode) {
        return res.status(401).json({ message: "The Validation Code is Wrong/Expired" });
    }
    return res.status(200).json({ message: "Correct Validation Code" });
})


router.post("/ResetPassword", async (req, res) => {
    const { inputEmail, confirmedPassword } = req.body;
    const hashed_password = await bcrypt.hash(confirmedPassword, 10);
    try {
        await db.query("UPDATE user_info SET password = ? WHERE email = ?", [hashed_password, inputEmail]);
        return res.status(200).json({message: "Password updated successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: "Internal Server Error"});
    }
})


router.post("/getUserInfo", async (req, res) => {
    const { user_id } = req.body;
    const [user_info] = await db.query("SELECT user_id, create_date, email, user_icon, username, user_icon FROM user_info WHERE user_id = ?", [user_id]);
    return res.json({userData: user_info[0]})
})


module.exports = router;