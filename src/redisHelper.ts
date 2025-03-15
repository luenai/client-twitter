import {createClient, RedisClientType} from 'redis';

// Create a persistent Redis client
let redisClient: RedisClientType | null = null;

// Initialize the Redis client
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
        // Get or initialize Redis client
        const client = await initRedisClient(redisUrl);

        // Check if client is connected
        if (!client.isOpen) {
            await client.connect();
            console.log('Connected to Redis');
        }

        const result = await client.get(`user_tokens_${userId}`);
        return result;
    } catch (error) {
        console.error(`Error fetching tokens for user ${userId}:`, error);

        // Attempt to reset the client for future requests
        if (redisClient) {
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

// Close Redis client when app shuts down
export async function closeRedisConnection() {
    if (redisClient && redisClient.isOpen) {
        await redisClient.disconnect();
        redisClient = null;
    }
}
