import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // 强制输出详细错误（先用 console，确保 Railway 一定能看到）
  console.error('[ERROR_HANDLER]', {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    message: err?.message,
    stack: err?.stack,
  });

  logger.error('Unhandled server error', {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    message: err?.message,
    stack: err?.stack,
  });

  res.status(err?.statusCode || 500).json({
    success: false,
    message: '服务器内部错误，请稍后重试',
    timestamp: new Date().toISOString(),
  });
}