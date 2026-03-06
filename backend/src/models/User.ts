import { query } from '../config/database';

export interface User {
    id:                      string;
    username:                string;
    email:                   string;
    password_hash:           string;
    avatar_url?:             string;
    display_name?:           string;
    is_active:               boolean;
    is_banned:               boolean;
    role:                    'user' | 'admin' | 'moderator';
    email_verified:          boolean;
    email_verify_token?:     string;
    email_verify_expires?:   Date;
    email_verify_code_hash?: string;
    email_verify_attempts?:  number;
    email_verify_sent_at?:   Date;
    password_reset_token?:   string;
    password_reset_expires?: Date;
    failed_login_attempts:   number;
    lockout_until?:          Date;
    last_login_at?:          Date;
    last_login_ip?:          string;
    created_at:              Date;
    updated_at:              Date;
}

export type SafeUser = Omit<
    User,
    'password_hash' | 'email_verify_token' | 'password_reset_token' |
    'email_verify_expires' | 'password_reset_expires'
>;

export const UserModel = {

    async create(data: {
        username:     string;
        email:        string;
        passwordHash: string;
    }): Promise<User> {
        const rows = await query<User>(
            `INSERT INTO users (username, email, password_hash, email_verified)
             VALUES ($1, $2, $3, true)
             RETURNING *`,
            [data.username, data.email, data.passwordHash]
        );
        return rows[0];
    },

    async findByEmail(email: string): Promise<User | null> {
        const rows = await query<User>(
            'SELECT * FROM users WHERE email = $1 LIMIT 1',
            [email.toLowerCase().trim()]
        );
        return rows[0] ?? null;
    },

    async findByUsername(username: string): Promise<User | null> {
        const rows = await query<User>(
            'SELECT * FROM users WHERE username = $1 LIMIT 1',
            [username.trim()]
        );
        return rows[0] ?? null;
    },

    async findById(id: string): Promise<User | null> {
        const rows = await query<User>(
            'SELECT * FROM users WHERE id = $1 LIMIT 1',
            [id]
        );
        return rows[0] ?? null;
    },

    async verifyEmail(token: string): Promise<User | null> {
        const rows = await query<User>(
            `UPDATE users
             SET email_verified      = TRUE,
                 is_active           = TRUE,
                 email_verify_token  = NULL,
                 email_verify_expires= NULL
             WHERE email_verify_token = $1
               AND email_verify_expires > NOW()
             RETURNING *`,
            [token]
        );
        return rows[0] ?? null;
    },

    async updateLoginSuccess(id: string, ip: string): Promise<void> {
        await query(
            `UPDATE users
             SET failed_login_attempts = 0,
                 lockout_until         = NULL,
                 last_login_at         = NOW(),
                 last_login_ip         = $2
             WHERE id = $1`,
            [id, ip]
        );
    },

    async incrementFailedAttempts(
        id:             string,
        maxAttempts:    number,
        lockoutMinutes: number
    ): Promise<void> {
        await query(
            `UPDATE users
             SET failed_login_attempts = failed_login_attempts + 1,
                 lockout_until = CASE
                    WHEN failed_login_attempts + 1 >= $2
                    THEN NOW() + ($3 || ' minutes')::INTERVAL
                    ELSE lockout_until
                 END
             WHERE id = $1`,
            [id, maxAttempts, lockoutMinutes]
        );
    },

    async existsByEmailOrUsername(
        email:    string,
        username: string
    ): Promise<{ emailExists: boolean; usernameExists: boolean }> {
        const rows = await query<{ field: string }>(
            `SELECT 'email'    AS field FROM users WHERE email    = $1
             UNION ALL
             SELECT 'username' AS field FROM users WHERE username = $2`,
            [email.toLowerCase().trim(), username]
        );
        return {
            emailExists:    rows.some(r => r.field === 'email'),
            usernameExists: rows.some(r => r.field === 'username'),
        };
    },

    async checkEmailExists(email: string): Promise<boolean> {
        const rows = await query<{ id: string }>(
            'SELECT id FROM users WHERE email = $1 LIMIT 1',
            [email.toLowerCase().trim()]
        );
        return rows.length > 0;
    },

    async checkUsernameExists(username: string): Promise<boolean> {
        const rows = await query<{ id: string }>(
            'SELECT id FROM users WHERE username = $1 LIMIT 1',
            [username]
        );
        return rows.length > 0;
    },

    async updateProfile(id: string, data: {
        username:     string;
        display_name: string | null;
    }): Promise<SafeUser> {
        const rows = await query<User>(
            `UPDATE users
             SET username     = $2,
                 display_name = $3,
                 updated_at   = NOW()
             WHERE id = $1
             RETURNING *`,
            [id, data.username, data.display_name]
        );
        return UserModel.sanitize(rows[0]);
    },

    sanitize(user: User): SafeUser {
        const {
            password_hash, email_verify_token,
            password_reset_token, email_verify_expires,
            password_reset_expires, ...safe
        } = user;
        return safe;
    },

    async saveVerifyCode(userId: string, hash: string, expires: Date): Promise<void> {
        await query(
            `UPDATE users
             SET email_verify_code_hash = $2,
                 email_verify_expires   = $3,
                 email_verify_attempts  = 0,
                 email_verify_sent_at   = NOW()
             WHERE id = $1`,
            [userId, hash, expires]
        );
    },

    async verifyEmailByCode(userId: string, code: string): Promise<boolean> {
        const rows = await query<User>(
            `SELECT * FROM users WHERE id = $1 LIMIT 1`,
            [userId]
        );
        const user = rows[0];
        if (!user) return false;

        // 检查是否过期
        if (!user.email_verify_expires || user.email_verify_expires < new Date()) return false;

        // 检查尝试次数
        if ((user.email_verify_attempts ?? 0) >= 5) return false;

        // 验证码校验
        const inputHash = require('crypto').createHash('sha256').update(code).digest('hex');
        if (inputHash !== user.email_verify_code_hash) {
            // 增加尝试次数
            await query(
                'UPDATE users SET email_verify_attempts = email_verify_attempts + 1 WHERE id = $1',
                [userId]
            );
            return false;
        }

        // 验证成功，激活账号
        await query(
            `UPDATE users
             SET email_verified         = true,
                 email_verify_code_hash = NULL,
                 email_verify_expires   = NULL,
                 email_verify_attempts  = 0
             WHERE id = $1`,
            [userId]
        );
        return true;
    },

    async canResendCode(userId: string): Promise<boolean> {
        const rows = await query<User>(
            'SELECT email_verify_sent_at FROM users WHERE id = $1',
            [userId]
        );
        const user = rows[0];
        if (!user?.email_verify_sent_at) return true;
        // 60秒内只能发一次
        return (Date.now() - new Date(user.email_verify_sent_at).getTime()) > 60_000;
    },

    async deleteById(id: string): Promise<void> {
        await query('DELETE FROM users WHERE id = $1', [id]);
    },
};