const redis = require("redis");
const redisClient = redis.createClient();

redisClient.connect()
.then(async () => {
    console.log("Redis Connected successfully");
})


module.exports = redisClient;