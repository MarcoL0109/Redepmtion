const redis = require("redis");

const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'redis', 
        port: 6379
    }
});
const subscriber = redisClient.duplicate();

// Create an anonymous async function and call it immediately
(async () => {
    try {
        await redisClient.connect();
        console.log("Redis Connected successfully");

        await subscriber.connect();
        console.log("Subscriber Redis Connected successfully");

        // Now that we are connected, set the config
        await redisClient.configSet('notify-keyspace-events', 'Ex');
        console.log("Redis Keyspace Notifications enabled");
        
    } catch (err) {
        console.error("Redis Connection Error:", err);
    }
})();

module.exports = { redisClient, subscriber };