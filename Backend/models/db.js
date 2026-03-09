const mysql = require("mysql2");
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.REACT_APP_DATABASE_HOST,
    user: process.env.REACT_APP_DATABASE_USER,
    password: process.env.REACT_APP_DATABASE_PASSWORD,
    database: process.env.REACT_APP_DATABASE_NAME,
}).promise();

module.exports = db;