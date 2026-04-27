console.log("!!! SERVER.JS IS STARTING !!!"); // Add this as line 1
require('dotenv').config();
const express = require("express");
const path = require('path');
const cors = require("cors");
const sessions = require("express-session");
const { redisClient } = require("./utils/redis.js"); // Ensure this is imported
const { RedisStore } = require("connect-redis");
const cookie_parser = require("cookie-parser");

// APIs
const userAPIs = require('./API/accountManagement.js');
const utilAPIs = require('./utils/utils.js');
const problemSetsAPIs = require('./API/problemSetManagement.js');
const roomManagementAPI = require('./API/quizRoomManagement.js');

const app = express();

// 1. Create a startup function
async function startApp() {
    try {
        // 2. WAIT for Redis first. This is the bottleneck!
        if (!redisClient.isOpen) {
            console.log("🔄 Connecting to Redis...");
            await redisClient.connect();
        }
        console.log("✅ Redis Connected.");

        // 3. NOW initialize middleware that depends on Redis
        app.use(cookie_parser("Secret Cookie"));
        app.use(cors({ credentials: true, origin: true }));
        app.use(express.json()); // Moved up to ensure it's available for all routes

        app.use(sessions({
            secret: process.env.REACT_APP_SESSION_SECRET,
            store: new RedisStore({ client: redisClient }),
            resave: false,
            saveUninitialized: true,
            cookie: { maxAge: 180 * 60 * 1000 }
        }));

        // 4. Static Files
        const distPath = path.join(__dirname, '../Frontend/dist');
        app.use(express.static(distPath));

        // 5. API Routes
        app.use("/api/users", userAPIs);
        app.use("/utils/", utilAPIs);
        app.use("/api/problemsets", problemSetsAPIs);
        app.use("/api/rooms", roomManagementAPI);

        // 6. Catch-all for SPA (Use the newer syntax to avoid Express 5 errors)
        app.get('/', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });

        // 7. Finally, listen
        const PORT = parseInt(process.env.REACT_APP_SERVER_PORT) || 5500;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server is listening on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ CRITICAL: Server failed to start:", err);
        process.exit(1); // Tell Docker the container failed so it can restart
    }
}

startApp();