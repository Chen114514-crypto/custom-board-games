import bcrypt from 'bcryptjs';
import { UserModel, User } from '../models/User';
import { TokenService } from './tokenService';
import { EmailService } from './emailService';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';
import { query } from '../config/database';

export interface RegisterDto {
    username: string;
    email:    string;
    password: string;
}

export interface LoginDto {
    email:       string;
    password:    string;
    deviceInfo?: string;
    ipAddress?:  string;
}

export interface AuthResult {
    user:         ReturnType<typeof UserModel.sanitize>;
    accessToken:  string;
    refreshToken: string;
}

class AppError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'AppError';
    }
}

export const AuthService = {

    // ==================== 注册（仅发验证码，不创建账号）====================
    async register(dto: RegisterDto): Promise<{ message: string; pendingId: string }> {
        const { emailExists, usernameExists } =
            await UserModel.existsByEmailOrUsername(dto.email, dto.username);

        if (emailExists)    throw new AppError('EMAIL_EXISTS',    '该邮箱已被注册');
        if (usernameExists) throw new AppError('USERNAME_EXISTS', '该用户名已被使用');

        const passwordHash = await bcrypt.hash(dto.password, ENV.BCRYPT_ROUNDS);
        const { code, hash, expires } = TokenService.generateVerifyCode();

        await query(
            'DELETE FROM pending_verifications WHERE email = $1 OR username = $2',
            [dto.email.toLowerCase().trim(), dto.username]
        );

        const rows = await query<{ id: string }>(
            `INSERT INTO pending_verifications
               (username, email, password_hash, code, expires_at, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING id`,
            [dto.username, dto.email.toLowerCase().trim(), passwordHash, hash, expires]
        );
        const pendingId = rows[0].id;

        try {
            await EmailService.sendVerificationEmail(dto.email, dto.username, code);
        } catch (e: any) {
            console.error('[MAIL_SEND_ERROR]', e?.message, e?.stack);
            throw new Error('验证码邮件发送失败，请检查 SMTP 配置');
        }

        logger.info('待注册记录已创建', { pendingId, username: dto.username });
        return { message: '验证码已发送至您的邮箱，请在10分钟内完成验证。', pendingId };
    },

    // ==================== 验证码确认注册并直接登录 ====================
    async verifyEmailByCode(pendingId: string, code: string, deviceInfo?: string, ipAddress?: string): Promise<AuthResult> {
        if (!pendingId || !code) throw new AppError('INVALID_INPUT', '参数缺失');

        const rows = await query<{
            id: string; username: string; email: string;
            password_hash: string; code: string; expires_at: Date;
        }>(
            `SELECT id, username, email, password_hash, code, expires_at
               FROM pending_verifications
               WHERE id = $1
               LIMIT 1`,
            [pendingId]
        );

        const pending = rows[0];
        if (!pending) throw new AppError('INVALID_CODE', '注册申请不存在或已过期');

        if (new Date(pending.expires_at) < new Date()) {
            throw new AppError('CODE_EXPIRED', '验证码已过期，请重新注册');
        }

        const inputHash = require('crypto').createHash('sha256').update(code).digest('hex');
        if (inputHash !== pending.code) {
            throw new AppError('INVALID_CODE', '验证码错误');
        }

        // 正式创建账号
        const user = await UserModel.create({
            username:     pending.username,
            email:        pending.email,
            passwordHash: pending.password_hash,
        });

        await query('DELETE FROM pending_verifications WHERE id = $1', [pendingId]);

        // 直接生成登录 token
        const accessToken  = TokenService.generateAccessToken({
            userId: user.id,
            email:  user.email,
            role:   user.role,
        });
        const refreshToken = TokenService.generateRefreshToken();
        await TokenService.saveRefreshToken({
            userId:     user.id,
            token:      refreshToken,
            deviceInfo,
            ipAddress,
        });

        logger.info('新用户注册并登录成功', { userId: user.id, username: user.username });
        return { user: UserModel.sanitize(user), accessToken, refreshToken };
    },

    // ==================== 重新发送验证码 ====================
    async resendVerification(email: string): Promise<{ pendingId: string }> {
        const rows = await query<{ id: string; username: string; created_at: Date }>(
            `SELECT id, username, created_at
               FROM pending_verifications
               WHERE email = $1
               ORDER BY created_at DESC
               LIMIT 1`,
            [email.toLowerCase().trim()]
        );
        const pending = rows[0];
        if (!pending) throw new AppError('NOT_FOUND', '未找到注册申请，请重新注册');

        if (pending.created_at && (Date.now() - new Date(pending.created_at).getTime()) < 60_000) {
            throw new AppError('TOO_FREQUENT', '发送过于频繁，请60秒后再试');
        }

        const { code, hash, expires } = TokenService.generateVerifyCode();
        await query(
            `UPDATE pending_verifications
               SET code = $2, expires_at = $3
               WHERE id = $1`,
            [pending.id, hash, expires]
        );

        try {
            await EmailService.sendVerificationEmail(email, pending.username, code);
        } catch (e: any) {
            console.error('[MAIL_SEND_ERROR]', e?.message, e?.stack);
            throw new Error('验证码邮件发送失败，请检查 SMTP 配置');
        }

        logger.info('重新发送验证码', { pendingId: pending.id });
        return { pendingId: pending.id };
    },

    // ==================== 登录 ====================
    async login(dto: LoginDto): Promise<AuthResult> {
        const isEmail = dto.email.includes('@');
        const user = isEmail
            ? await UserModel.findByEmail(dto.email)
            : await UserModel.findByUsername(dto.email);

        const writeLog = (success: boolean, reason?: string) =>
            query(
                `INSERT INTO login_logs
                   (user_id, email, ip_address, success, fail_reason)
                 VALUES ($1,$2,$3,$4,$5)`,
                [user?.id ?? null, dto.email,
                 dto.ipAddress ?? null, success, reason ?? null]
            ).catch(() => {});

        if (!user) {
            await writeLog(false, 'USER_NOT_FOUND');
            throw new AppError('INVALID_CREDENTIALS', '邮箱或密码错误');
        }

        if (user.is_banned) {
            await writeLog(false, 'ACCOUNT_BANNED');
            throw new AppError('ACCOUNT_BANNED', '账号已被封禁，请联系管理员');
        }

        if (user.lockout_until && user.lockout_until > new Date()) {
            const minutesLeft = Math.ceil(
                (user.lockout_until.getTime() - Date.now()) / 60_000
            );
            await writeLog(false, 'ACCOUNT_LOCKED');
            throw new AppError('ACCOUNT_LOCKED', `账号已暂时锁定，请 ${minutesLeft} 分钟后重试`);
        }

        if (!user.email_verified) {
            await writeLog(false, 'EMAIL_NOT_VERIFIED');
            throw new AppError('EMAIL_NOT_VERIFIED', '请先验证邮箱后再登录');
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.password_hash);
        if (!passwordMatch) {
            await UserModel.incrementFailedAttempts(
                user.id, ENV.MAX_LOGIN_ATTEMPTS, ENV.LOCKOUT_DURATION_MIN
            );
            await writeLog(false, 'WRONG_PASSWORD');
            const remaining = ENV.MAX_LOGIN_ATTEMPTS - (user.failed_login_attempts + 1);
            const msg = remaining > 0
                ? `密码错误，还可尝试 ${remaining} 次`
                : `密码错误次数过多，账号已锁定 ${ENV.LOCKOUT_DURATION_MIN} 分钟`;
            throw new AppError('INVALID_CREDENTIALS', msg);
        }

        await UserModel.updateLoginSuccess(user.id, dto.ipAddress ?? '');
        await writeLog(true);

        const accessToken  = TokenService.generateAccessToken({
            userId: user.id,
            email:  user.email,
            role:   user.role,
        });
        const refreshToken = TokenService.generateRefreshToken();
        await TokenService.saveRefreshToken({
            userId:     user.id,
            token:      refreshToken,
            deviceInfo: dto.deviceInfo,
            ipAddress:  dto.ipAddress,
        });

        logger.info('用户登录成功', { userId: user.id });
        return { user: UserModel.sanitize(user), accessToken, refreshToken };
    },

    // ==================== 刷新 Token ====================
    async refreshToken(token: string): Promise<{ accessToken: string }> {
        const userId = await TokenService.verifyRefreshToken(token);
        if (!userId) throw new AppError('INVALID_TOKEN', '令牌无效或已过期，请重新登录');

        const user = await UserModel.findById(userId);
        if (!user || !user.is_active)
            throw new AppError('USER_INACTIVE', '账号不可用');

        const accessToken = TokenService.generateAccessToken({
            userId: user.id,
            email:  user.email,
            role:   user.role,
        });
        return { accessToken };
    },

    // ==================== 登出 ====================
    async logout(refreshToken: string): Promise<void> {
        await TokenService.revokeRefreshToken(refreshToken);
        logger.info('用户登出', { tokenHash: refreshToken.slice(0, 8) + '...' });
    },

    // ==================== 验证邮箱（旧Token方式，保留兼容）====================
    async verifyEmail(token: string): Promise<{ message: string }> {
        if (!token) throw new AppError('INVALID_TOKEN', '缺少验证令牌');
        const user = await UserModel.verifyEmail(token);
        if (!user)  throw new AppError('INVALID_TOKEN', '验证链接无效或已过期');
        logger.info('邮箱验证成功', { userId: user.id });
        return { message: '邮箱验证成功！现在可以登录了。' };
    },

    // ==================== 修改密码 ====================
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await UserModel.findById(userId);
        if (!user) throw new AppError('USER_NOT_FOUND', '用户不存在');

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) throw new AppError('INVALID_CREDENTIALS', '当前密码错误');

        const newHash = await bcrypt.hash(newPassword, ENV.BCRYPT_ROUNDS);
        await query(
            'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1',
            [userId, newHash]
        );
        logger.info('用户修改密码成功', { userId });
    },
};