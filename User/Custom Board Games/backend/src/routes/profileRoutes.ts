import { Router } from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/profileController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = Router();

// Get user profile
router.get('/profile', authMiddleware, getUserProfile);

// Update user profile
router.put('/profile', authMiddleware, uploadMiddleware.single('avatar'), updateUserProfile);

export default router;