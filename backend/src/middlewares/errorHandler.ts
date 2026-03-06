import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error('[API_ERROR]', {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    message: err?.message,
    stack: err?.stack,
  });

  res.status(err?.statusCode || 500).json({
    success: false,
    message: err?.message || '服务器内部错误，请稍后重试',
    timestamp: new Date().toISOString(),
  });
}