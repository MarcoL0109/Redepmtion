require('dotenv').config();
const express = require("express");
const cors = require("cors")
const sessions = require("express-session");
const app = express();
const userAPIs = require('./API/accountManagement.js');
const utilAPIs = require('./utils/utils.js');
const problemSetsAPIs = require('./API/problemSetManagement.js');
const redis = require("redis");
const {RedisStore} = require("connect-redis");
const redisClient = redis.createClient();
const cookie_parser = require("cookie-parser");

redisClient.connect()
.then(async () => {
    console.log("Redis Connected successfully");
})

app.use(cookie_parser("Secret Cookie"));
app.use(cors({ credentials: true, origin: true }));
app.use(sessions({
    secret: process.env.REACT_APP_SESSION_SECRET,
    store: new RedisStore({client: redisClient}),
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 30 * 60 * 1000,
    }
}))
app.use(express.json());

// API routes
app.use("/api/users", userAPIs);
app.use("/utils/", utilAPIs);
app.use("/api/problemsets", problemSetsAPIs);

app.listen(parseInt(process.env.REACT_APP_SERVER_PORT), () => {
    console.log("Server is running");
});