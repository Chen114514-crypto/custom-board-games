import { Request, Response, NextFunction } from 'express';
import { TokenService, JwtPayload } from '../services/tokenService';
import { sendError } from '../utils/response';

declare global {
    namespace Express {
        interface Request { user?: JwtPayload; }
    }
}

export const authenticate = (
    req: Request, res: Response, next: NextFunction
): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        sendError(res, '未提供认证令牌', 401);
        return;
    }
    try {
        req.user = TokenService.verifyAccessToken(header.slice(7));
        next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            sendError(res, '令牌已过期，请刷新或重新登录', 401);
        } else {
            sendError(res, '令牌无效', 401);
        }
    }
};

export const requireRole = (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            sendError(res, '权限不足', 403);
            return;
        }
        next();
    };