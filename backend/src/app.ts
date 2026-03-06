import express from 'express';
import pool from './config/database';
import * as fs from 'fs';
import * as path from 'path';

const app = express();

// 启动时自动初始化数据库
const initDatabase = async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✅ 数据库初始化成功');
  } catch (err: any) {
    console.error('⚠️ 数据库初始化提示:', err.message.slice(0, 100));
  }
};

// 应用启动前初始化
app.listen(PORT, async () => {
  await initDatabase();
  console.log(`🚀 服务运行在 http://localhost:${PORT}`);
});

export default app;