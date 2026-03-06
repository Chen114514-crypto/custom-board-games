import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

// 登录：15 分钟 10 次
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      10,
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (_req, res) =>
        sendError(res, '登录尝试过于频繁，请 15 分钟后重试', 429),
});

// 注册：1 小时 5 次
export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      5,
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (_req, res) =>
        sendError(res, '注册请求过于频繁，请稍后再试', 429),
});

// 通用：15 分钟 200 次
export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      200,
    standardHeaders: true,
    legacyHeaders:   false,
    handler: (_req, res) =>
        sendError(res, '请求过于频繁，请稍后重试', 429),
});