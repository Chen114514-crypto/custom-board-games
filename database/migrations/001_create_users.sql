-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== 用户主表 ====================
CREATE TABLE IF NOT EXISTS users (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(32)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(500),
    display_name    VARCHAR(64),

    -- 状态
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned   BOOLEAN NOT NULL DEFAULT FALSE,
    role        VARCHAR(16) NOT NULL DEFAULT 'user'
                CHECK (role IN ('user','admin','moderator')),

    -- 邮箱验证
    email_verified        BOOLEAN     NOT NULL DEFAULT FALSE,
    email_verify_token    VARCHAR(128),
    email_verify_expires  TIMESTAMPTZ,

    -- 密码重置
    password_reset_token   VARCHAR(128),
    password_reset_expires TIMESTAMPTZ,

    -- 登录安全
    failed_login_attempts SMALLINT    NOT NULL DEFAULT 0,
    lockout_until         TIMESTAMPTZ,
    last_login_at         TIMESTAMPTZ,
    last_login_ip         INET,

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== Refresh Token 表 ====================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address  INET,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== 登录日志表 ====================
CREATE TABLE IF NOT EXISTS login_logs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    email       VARCHAR(255),
    ip_address  INET,
    user_agent  TEXT,
    success     BOOLEAN     NOT NULL,
    fail_reason VARCHAR(128),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== 索引 ====================
CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username      ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_verify_token  ON users(email_verify_token) WHERE email_verify_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_login_logs_user     ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created  ON login_logs(created_at DESC);

-- ==================== 自动更新 updated_at ====================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();