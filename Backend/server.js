require('dotenv').config();
const express = require("express");
const cors = require("cors")
const sessions = require("express-session");
const app = express();
const userAPIs = require('./API/accountManagement.js');
const utilAPIs = require('./utils/utils.js');
const problemSetsAPIs = require('./API/problemSetManagement.js');
const roomManagementAPI = require('./API/quizRoomManagement.js');
const {redisClient, subscriber} = require("./utils/redis.js");
const {RedisStore} = require("connect-redis");
const cookie_parser = require("cookie-parser");


app.use(cookie_parser("Secret Cookie"));
app.use(cors({ credentials: true, origin: true }));
app.use(sessions({
    secret: process.env.REACT_APP_SESSION_SECRET,
    store: new RedisStore({client: redisClient}),
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 180 * 60 * 1000,
    }
}))
app.use(express.json());

// API routes
app.use("/api/users", userAPIs);
app.use("/utils/", utilAPIs);
app.use("/api/problemsets", problemSetsAPIs);
app.use("/api/rooms", roomManagementAPI);

app.listen(parseInt(process.env.REACT_APP_SERVER_PORT), () => {
    console.log("Server is running");
});