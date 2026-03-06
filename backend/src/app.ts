import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { ENV } from './config/env';
import { testConnection } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { generalRateLimiter } from './middlewares/rateLimiter';
import routes from './routes/index';

const app = express();

// ==================== 安全头 ====================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc:   ["'self'", "'unsafe-inline'"],
            scriptSrc:  ["'self'"],
            imgSrc:     ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// ==================== CORS ====================
app.use(cors({
    origin:         ENV.FRONTEND_URL,
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge:         86400,
}));

// ==================== 基础中间件 ====================
app.set('trust proxy', 1);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('combined', {
    stream: { write: (msg: string) => logger.http(msg.trim()) },
}));

// ==================== 全局限流 ====================
app.use(generalRateLimiter);

// ==================== 健康检查 ====================
app.get('/health', (_req, res) => {
    res.json({
        status:  'ok',
        version: '1.0.0',
        time:    new Date().toISOString(),
        env:     ENV.NODE_ENV,
    });
});

// ==================== API 路由 ====================
app.use('/api', routes);

// ==================== 404 ====================
app.use((_req, res) => {
    res.status(404).json({
        success:   false,
        message:   '接口不存在',
        timestamp: new Date().toISOString(),
    });
});

// ==================== 全局错误处理 ====================
app.use(errorHandler);

// ==================== 启动 ====================
const bootstrap = async (): Promise<void> => {
    try {
        await testConnection();
        app.listen(ENV.PORT, () => {
            logger.info(`🚀 服务启动成功`, {
                port: ENV.PORT,
                env:  ENV.NODE_ENV,
                url:  `http://localhost:${ENV.PORT}`,
            });
        });
    } catch (err: any) {
        logger.error('❌ 服务启动失败', { error: err.message });
        process.exit(1);
    }
};

bootstrap();

export default app;