import { Router } from 'express';
import {
    AuthController,
    registerValidators,
    loginValidators
} from '../controllers/authController';
import { validate }            from '../middlewares/validate';
import {
    loginRateLimiter,
    registerRateLimiter
} from '../middlewares/rateLimiter';
import { authenticate }        from '../middlewares/authMiddleware';

const router = Router();

// 公开接口
router.post('/register',            registerRateLimiter, validate(registerValidators), AuthController.register);  
router.post('/login',               loginRateLimiter,    validate(loginValidators),    AuthController.login);     
router.post('/resend-verification', AuthController.resendVerification);
router.post('/verify-email',        AuthController.verifyEmailByCode);  // 改成这个
router.get ('/check-email',         AuthController.checkEmail);
router.get ('/check-username',      AuthController.checkUsername);
router.post('/logout',              AuthController.logout);
router.post('/refresh',             AuthController.refreshToken);

// 需要验证接口
router.get  ('/me',              authenticate, AuthController.getMe);
router.patch('/profile',         authenticate, AuthController.updateProfile);
router.post ('/change-password', authenticate, AuthController.changePassword);

export default router;