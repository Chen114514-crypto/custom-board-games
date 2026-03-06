import { Router } from 'express';
import authRoutes from './authRoutes';

const router = Router();

router.use('/auth', authRoutes);

// 后续扩展：
// router.use('/board',  boardRoutes);
// router.use('/game',   gameRoutes);
// router.use('/user',   userRoutes);

export default router;