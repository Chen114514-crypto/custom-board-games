import { Pool, PoolClient } from 'pg';
import { ENV } from './env';
import { logger } from '../utils/logger';

const pool = new Pool({
    host:     ENV.DB_HOST,
    port:     ENV.DB_PORT,
    database: ENV.DB_NAME,
    user:     ENV.DB_USER,
    password: ENV.DB_PASSWORD,
    ssl:      ENV.DB_SSL ? { rejectUnauthorized: false } : false,
    max:                    20,
    idleTimeoutMillis:      30_000,
    connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
    logger.error('数据库连接池错误', { error: err.message });
});

// 通用查询
export const query = async <T = any>(
    text: string,
    params?: any[]
): Promise<T[]> => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 1000) {
            logger.warn('慢查询', { sql: text.slice(0, 80), duration });
        }
        return result.rows as T[];
    } catch (error: any) {
        logger.error('查询失败', { sql: text.slice(0, 80), error: error.message });
        throw error;
    }
};

// 获取连接（手动事务）
export const getClient = (): Promise<PoolClient> => pool.connect();

// 事务包装器
export const transaction = async <T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// 连接测试
export const testConnection = async (): Promise<void> => {
    const rows = await query<{ now: Date }>('SELECT NOW()');
    logger.info('✅ 数据库连接成功', { serverTime: rows[0].now });
};

export default pool;