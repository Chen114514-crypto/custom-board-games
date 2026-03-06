import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pool from './config/database';
import * as fs from 'fs';
import * as path from 'path';
import { ENV } from './config/env';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { generalRateLimiter } from './middlewares/rateLimiter';

const app = express();

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin: [
    'https://chen114514-crypto.github.io',
    'http://localhost:5173',
    'http://192.168.40.15:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('combined', {
  stream: { write: (msg: string) => logger.http(msg.trim()) }
}));
app.use(generalRateLimiter);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    time: new Date().toISOString(),
    env: ENV.NODE_ENV
  });
});

// 路由
app.use('/api', routes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 错误处理
app.use(errorHandler);

// 启动时初始化数据库
const initDatabase = async () => {
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      email_verified_at TIMESTAMP,
      failed_login_attempts INT DEFAULT 0,
      locked_until TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS pending_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(500) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `;
  
  try {
    await pool.query(createTablesSql);
    logger.info('✅ 数据库初始化成功');
  } catch (err: any) {
    logger.warn('⚠️ 数据库初始化:', err.message.slice(0, 100));
  }
};

// 启动服务
const PORT = ENV.PORT || 3000;

// 启动时初始化数据库并启动服务
(async () => {
  await initDatabase();
  app.listen(PORT, () => {
    logger.info(`🚀 服务运行在端口 ${PORT}`);
  });
})();

export default app;