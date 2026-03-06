import { Request, Response, NextFunction } from 'express';
import { body, query as queryValidator } from 'express-validator';
import { AuthService } from '../services/authService';
import { UserModel } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { ENV } from '../config/env';

// ==================== 校验规则 ====================
export const registerValidators = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 32 })
        .withMessage('用户名长度为 3-32 个字符')
        .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
        .withMessage('用户名只能包含字母、数字、下划线及中文'),

    body('email')
        .isEmail().withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8, max: 72 })
        .withMessage('密码长度为 8-72 个字符')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密码必须包含大写字母、小写字母和数字'),

    body('confirmPassword')
        .custom((val, { req }) => val === req.body.password)
        .withMessage('两次输入的密码不一致'),
];

export const loginValidators = [
    body('email')
        .notEmpty().withMessage('请输入邮箱或用户名'),
    body('password')
        .notEmpty().withMessage('请输入密码'),
];

// ==================== 控制器 ====================
export const AuthController = {

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.register({
                username: req.body.username,
                email:    req.body.email,
                password: req.body.password,
            });
            sendSuccess(res, { pendingId: result.pendingId }, result.message, 201);
        } catch (err: any) {
            console.error('[REGISTER_ERROR]', {
                body: req.body,
                message: err?.message,
                stack: err?.stack,
            });
            return next(err);
        }
    },

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.login({
                email:      req.body.email,
                password:   req.body.password,
                deviceInfo: req.headers['user-agent'],
                ipAddress:  req.ip,
            });

            // Refresh Token → HttpOnly Cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure:   ENV.IS_PROD,
                sameSite: 'strict',
                maxAge:   7 * 24 * 60 * 60 * 1000,
                path:     '/api/auth/refresh',
            });

            sendSuccess(res, {
                user:        result.user,
                accessToken: result.accessToken,
            }, '登录成功');
        } catch (err) { next(err); }
    },

    async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.cookies?.refreshToken as string | undefined;
            if (!token) { sendError(res, '未找到刷新令牌，请重新登录', 401); return; }
            const result = await AuthService.refreshToken(token);
            sendSuccess(res, result, 'Token 刷新成功');
        } catch (err) { next(err); }
    },

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.cookies?.refreshToken as string | undefined;
            if (token) await AuthService.logout(token);
            res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
            sendSuccess(res, null, '已成功登出');
        } catch (err) { next(err); }
    },

    async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // 兼容旧 token 链接方式（直接跳转失败页）
            const token = req.query.token as string;
            if (token) {
                res.redirect(`${ENV.FRONTEND_URL}/auth.html?tab=verify&error=请使用验证码验证`);
                return;
            }
            sendError(res, '请使用验证码验证', 400);
        } catch (err) { next(err); }
    },

    async verifyEmailByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { pendingId, code } = req.body;
            if (!pendingId || !code) { sendError(res, '参数缺失', 400); return; }
            const result = await AuthService.verifyEmailByCode(
                pendingId, code,
                req.headers['user-agent'],
                req.ip
            );

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure:   ENV.IS_PROD,
                sameSite: 'strict',
                maxAge:   7 * 24 * 60 * 60 * 1000,
                path:     '/api/auth/refresh',
            });

            sendSuccess(res, {
                user:        result.user,
                accessToken: result.accessToken,
            }, '注册成功！');
        } catch (err) { next(err); }
    },

    async checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const email = (req.query.email as string)?.trim();
            if (!email) { sendError(res, '缺少参数', 400); return; }
            const exists = await UserModel.checkEmailExists(email);
            sendSuccess(res, { exists }, '查询成功');
        } catch (err) { next(err); }
    },

    async checkUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const username = (req.query.username as string)?.trim();
            if (!username) { sendError(res, '缺少参数', 400); return; }
            const exists = await UserModel.checkUsernameExists(username);
            sendSuccess(res, { exists }, '查询成功');
        } catch (err) { next(err); }
    },

    async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const user = await UserModel.findById(userId);
            if (!user) { sendError(res, '用户不存在', 404); return; }
            sendSuccess(res, { user: UserModel.sanitize(user) }, '获取用户信息成功');
        } catch (err) { next(err); }
    },

    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const { username, display_name } = req.body;

            if (!username || username.trim().length < 2) {
                sendError(res, '用户名至少2个字符', 400); return;
            }

            // 检查用户名是否被其他人占用
            const exists = await UserModel.checkUsernameExists(username.trim());
            if (exists) {
                const current = await UserModel.findById(userId);
                if (current?.username !== username.trim()) {
                    sendError(res, '用户名已被占用', 409); return;
                }
            }

            const updated = await UserModel.updateProfile(userId, {
                username: username.trim(),
                display_name: display_name?.trim() || null,
            });

            sendSuccess(res, { user: updated }, '资料更新成功');
        } catch (err) { next(err); }
    },

    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                sendError(res, '请填写所有密码字段', 400); return;
            }
            if (newPassword.length < 8) {
                sendError(res, '新密码至少8位', 400); return;
            }
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
                sendError(res, '新密码必须包含大小写字母和数字', 400); return;
            }

            await AuthService.changePassword(userId, currentPassword, newPassword);
            sendSuccess(res, null, '密码修改成功');
        } catch (err) { next(err); }
    },

    async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) { sendError(res, '请输入邮箱', 400); return; }
            const result = await AuthService.resendVerification(email);
            sendSuccess(res, { pendingId: result.pendingId }, '验证码已重新发送，请查收');
        } catch (err) { next(err); }
    },
};