import pool from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

const initDb = async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../../migrations/001_init.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✅ 数据库初始化成功');
    process.exit(0);
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
    process.exit(1);
  }
};

initDb();