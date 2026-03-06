import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createHash, randomBytes } from 'crypto';
import { ENV } from '../config/env';
import { query } from '../config/database';

export interface JwtPayload {
    userId:  string;
    email:   string;
    role:    string;
    iat?:    number;
    exp?:    number;
}

export const TokenService = {

    generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
        return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
            expiresIn: ENV.JWT_ACCESS_EXPIRES_IN,
            issuer:    'custom-board-games',
            audience:  'web-client',
        } as jwt.SignOptions);
    },

    generateRefreshToken(): string {
        return randomBytes(64).toString('hex');
    },

    verifyAccessToken(token: string): JwtPayload {
        return jwt.verify(token, ENV.JWT_ACCESS_SECRET, {
            issuer:   'custom-board-games',
            audience: 'web-client',
        }) as JwtPayload;
    },

    hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    },

    async saveRefreshToken(data: {
        userId:      string;
        token:       string;
        deviceInfo?: string;
        ipAddress?:  string;
    }): Promise<void> {
        const tokenHash = TokenService.hashToken(data.token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await query(
            `INSERT INTO refresh_tokens
               (user_id, token_hash, device_info, ip_address, expires_at)
             VALUES ($1,$2,$3,$4,$5)`,
            [data.userId, tokenHash, data.deviceInfo ?? null,
             data.ipAddress ?? null, expiresAt]
        );
    },

    async verifyRefreshToken(token: string): Promise<string | null> {
        const tokenHash = TokenService.hashToken(token);
        const rows = await query<{ user_id: string }>(
            `SELECT user_id FROM refresh_tokens
             WHERE token_hash = $1
               AND revoked    = FALSE
               AND expires_at > NOW()
             LIMIT 1`,
            [tokenHash]
        );
        return rows[0]?.user_id ?? null;
    },

    async revokeRefreshToken(token: string): Promise<void> {
        const tokenHash = TokenService.hashToken(token);
        await query(
            'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
            [tokenHash]
        );
    },

    generateEmailToken(): { token: string; expires: Date } {
        const token   = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        return { token, expires };
    },

    // 生成6位数字验证码
    generateVerifyCode(): { code: string; hash: string; expires: Date } {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hash = crypto.createHash('sha256').update(code).digest('hex');
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟
        return { code, hash, expires };
    },

    verifyCode(inputCode: string, storedHash: string): boolean {
        const inputHash = crypto.createHash('sha256').update(inputCode).digest('hex');
        return inputHash === storedHash;
    },
};