import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`❌ 缺少必需的环境变量: ${key}`);
    return value;
};

export const ENV = {
    NODE_ENV:   process.env.NODE_ENV || 'development',
    PORT:       parseInt(process.env.PORT || '3000', 10),
    IS_PROD:    process.env.NODE_ENV === 'production',

    // 数据库
    DB_HOST:     requireEnv('DB_HOST'),
    DB_PORT:     parseInt(process.env.DB_PORT || '5432', 10),
    DB_NAME:     requireEnv('DB_NAME'),
    DB_USER:     requireEnv('DB_USER'),
    DB_PASSWORD: requireEnv('DB_PASSWORD'),
    DB_SSL:      process.env.DB_SSL === 'true',

    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    // JWT
    JWT_ACCESS_SECRET:      requireEnv('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET:     requireEnv('JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRES_IN:  process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // 邮件
    SMTP_HOST:  process.env.SMTP_HOST  || '',
    SMTP_PORT:  parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER:  process.env.SMTP_USER  || '',
    SMTP_PASS:  process.env.SMTP_PASS  || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@customboardgames.com',

    // 安全
    BCRYPT_ROUNDS:        parseInt(process.env.BCRYPT_ROUNDS        || '12', 10),
    MAX_LOGIN_ATTEMPTS:   parseInt(process.env.MAX_LOGIN_ATTEMPTS   || '5',  10),
    LOCKOUT_DURATION_MIN: parseInt(process.env.LOCKOUT_DURATION_MIN || '30', 10),

    // 前端
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};