const {redisClient, subscriber} = require("../utils/redis");

const idempotencyGuard = async (req, res, next) => {
    const key = req.headers['x-idempotency-key'];
    if (!key) return next();

    const redisKey = `req:http:${key}`;

    try {
        const isNew = await redisClient.set(redisKey, 'processing', 'EX', 3600, 'NX');
        if (!isNew) {
            return res.status(409).json({ 
                message: "Duplicate request detected or already processed." 
            });
        }
        next();
    } catch (err) {
        console.error("Redis Middleware Error:", err);
        next();
    }
};

module.exports = idempotencyGuard;