import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router = Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

export default router;