import nodemailer from 'nodemailer';
import dns from 'dns';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

dns.setDefaultResultOrder('ipv6first'); // 强制优先 IPv6

const transporter = nodemailer.createTransport({
    host:   'smtp.qq.com',
    port:   465,
    secure: true,
    auth:   { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS },
    tls: {
        rejectUnauthorized: false,
    },
});

export const EmailService = {

    async sendVerificationEmail(
        email:    string,
        username: string,
        code:     string
    ): Promise<void> {
        await transporter.sendMail({
            from:    `"自定义棋局设计器" <${ENV.EMAIL_FROM}>`,
            to:      email,
            subject: '【自定义棋局】您的邮箱验证码',
            html:    buildVerifyEmailHtml(username, code),
        });
        logger.info('验证码邮件已发送', { email });
    },

    async sendPasswordResetEmail(
        email:    string,
        username: string,
        token:    string
    ): Promise<void> {
        const resetUrl = `${ENV.FRONTEND_URL}/auth.html?token=${token}&action=reset`;

        await transporter.sendMail({
            from:    `"自定义棋局设计器" <${ENV.EMAIL_FROM}>`,
            to:      email,
            subject: '【自定义棋局】密码重置请求',
            html: buildResetEmailHtml(username, resetUrl),
        });

        logger.info('密码重置邮件已发送', { email });
    },
};

function buildVerifyEmailHtml(username: string, code: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Microsoft YaHei',sans-serif;background:#0d1117;padding:40px 20px}
  .wrap{max-width:560px;margin:0 auto;background:#161b22;border-radius:12px;overflow:hidden;border:1px solid #30363d}
  .hd{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center}
  .hd h1{color:#e94560;font-size:22px;margin-bottom:8px}
  .hd p{color:#8b949e;font-size:13px}
  .bd{padding:36px 32px}
  .bd h2{color:#e6edf3;font-size:18px;margin-bottom:12px}
  .bd p{color:#8b949e;line-height:1.8;font-size:14px;margin-bottom:16px}
  .code-box{background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:24px;text-align:center;margin:24px 0}
  .code{font-size:42px;font-weight:900;letter-spacing:12px;color:#e94560;font-family:monospace}
  .tip{background:#0d1117;border:1px solid #30363d;border-left:4px solid #e94560;border-radius:6px;padding:12px 16px;font-size:12px;color:#6e7681;margin-top:16px;line-height:1.6}
  .ft{text-align:center;padding:20px;color:#6e7681;font-size:12px;background:#0d1117}
</style>
</head>
<body>
<div class="wrap">
  <div class="hd"><h1>♟ 自定义棋局设计器</h1><p>Custom Board Games Designer</p></div>
  <div class="bd">
    <h2>你好，${username}！👋</h2>
    <p>您的邮箱验证码如下，请在 <strong style="color:#e6edf3">10分钟</strong> 内完成验证：</p>
    <div class="code-box">
      <div class="code">${code}</div>
    </div>
    <div class="tip">
      ⏰ 验证码 <strong style="color:#e6edf3">10分钟</strong> 后失效，每次只能使用一次。<br>
      🔒 如果您没有注册此账号，请忽略此邮件。<br>
      ⚠️ 请勿将验证码告知他人。
    </div>
  </div>
  <div class="ft">© 2026 Custom Board Games · 此邮件由系统自动发送，请勿回复</div>
</div>
</body></html>`;
}

function buildResetEmailHtml(username: string, resetUrl: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Microsoft YaHei',sans-serif;background:#0d1117;padding:40px 20px}
  .wrap{max-width:560px;margin:0 auto;background:#161b22;border-radius:12px;overflow:hidden;border:1px solid #30363d}
  .hd{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center}
  .hd h1{color:#e94560;font-size:22px;margin-bottom:8px}
  .bd{padding:36px 32px}
  .bd h2{color:#e6edf3;font-size:18px;margin-bottom:12px}
  .bd p{color:#8b949e;line-height:1.8;font-size:14px;margin-bottom:16px}
  .btn{display:inline-block;padding:14px 40px;background:#d29922;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700}
  .tip{background:#0d1117;border:1px solid #30363d;border-left:4px solid #d29922;border-radius:6px;padding:12px 16px;font-size:12px;color:#6e7681;margin-top:16px;line-height:1.6}
  .ft{text-align:center;padding:20px;color:#6e7681;font-size:12px;background:#0d1117}
</style>
</head>
<body>
<div class="wrap">
  <div class="hd"><h1>♟ 自定义棋局设计器</h1></div>
  <div class="bd">
    <h2>密码重置请求</h2>
    <p>你好 ${username}，我们收到了您的密码重置申请。点击下方按钮设置新密码：</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${resetUrl}" class="btn">🔑 重置密码</a>
    </div>
    <div class="tip">
      ⏱ 此链接将在 <strong style="color:#e6edf3">1小时</strong> 后失效。<br>
      🔒 如果您没有申请重置密码，请忽略此邮件。
    </div>
  </div>
  <div class="ft">© 2026 Custom Board Games · 此邮件由系统自动发送，请勿回复</div>
</div>
</body></html>`;
}