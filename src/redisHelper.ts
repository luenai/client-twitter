import {createClient, RedisClientType} from 'redis';

let redisClient: RedisClientType | null = null;

export async function initRedisClient(redisUrl) {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }

    redisClient = createClient({
        url: redisUrl || process.env.REDIS_URL,
        database: 4
    });

    redisClient.on('error', (err) => {
        console.error('Redis client error:', err);
    });

    await redisClient.connect();
    return redisClient;
}

export async function getTokensForUser(userId: string, redisUrl: string) {
    try {
        const client = await initRedisClient(redisUrl);

        if (!client.isOpen) {
            await client.connect();
            console.log('Connected to Redis');
        }

        return await client.get(`${userId}`);
    } catch (error) {
        console.error(`Error fetching tokens for user ${userId}:`, error);

        if (redisClient && redisClient.isOpen) {
            try {
                await redisClient.disconnect();
                redisClient = null;
            } catch (disconnectError) {
                console.error('Error disconnecting from Redis:', disconnectError);
            }
        }

        return null;
    }
}