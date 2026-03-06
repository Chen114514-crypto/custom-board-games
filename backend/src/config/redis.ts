import { createClient } from 'redis';
import { ENV } from './env';
import { logger } from '../utils/logger';

const redisClient = createClient({ url: ENV.REDIS_URL });

redisClient.on('error',   (err) => logger.error('Redis 错误',    { error: err.message }));
redisClient.on('connect', ()    => logger.info('✅ Redis 连接成功'));

export const connectRedis = async (): Promise<void> => {
    await redisClient.connect();
};

export default redisClient;