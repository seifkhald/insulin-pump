const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password:'',
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    reconnectOnError: function(err) {
        console.log('Reconnecting on error:', err);
        return true;
    }
});

redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('ready', () => {
    console.log('Redis is ready to accept commands');
});

redis.on('reconnecting', () => {
    console.log('Redis is reconnecting...');
});

process.on('SIGINT', async () => {
    await redis.quit();
    process.exit(0);
});

module.exports = redis;