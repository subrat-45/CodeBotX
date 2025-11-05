import Redis from "ioredis";

const clientRedis = new Redis({
    host : process.env.REDIS_HOST,
    port : process.env.REDIS_PORT,
    password : process.env.REDIS_PASSWORD
})

clientRedis.on('connect', () => {
    console.log("Redis connected")
})

export default clientRedis;