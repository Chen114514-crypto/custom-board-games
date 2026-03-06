import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

const HTTP_STATUS: Record<string, number> = {
    EMAIL_EXISTS:        409,
    USERNAME_EXISTS:     409,
    INVALID_CREDENTIALS: 400,
    ACCOUNT_BANNED:      403,
    ACCOUNT_LOCKED:      423,
    EMAIL_NOT_VERIFIED:  403,
    INVALID_TOKEN:       400,
    USER_INACTIVE:       403,
};

export const errorHandler = (
    err:   any,
    _req:  Request,
    res:   Response,
    _next: NextFunction
): void => {
    // 自定义业务错误
    if (err.name === 'AppError' && err.code) {
        sendError(res, err.message, HTTP_STATUS[err.code] ?? 400);
        return;
    }
    // PostgreSQL 唯一约束
    if (err.code === '23505') {
        sendError(res, '数据已存在，请勿重复提交', 409);
        return;
    }
    // JWT 错误
    if (err.name === 'JsonWebTokenError') {
        sendError(res, '令牌无效', 401);
        return;
    }
    // 未知错误
    logger.error('未处理的服务器错误', { message: err.message, stack: err.stack });
    sendError(res, '服务器内部错误，请稍后重试', 500);
};