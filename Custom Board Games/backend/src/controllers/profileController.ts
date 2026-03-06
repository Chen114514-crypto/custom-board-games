import { Request, Response } from 'express';
import { User } from '../models/User';
import { uploadAvatar } from '../middlewares/uploadMiddleware';

// Fetch user profile
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ username: user.username, avatar: user.avatar });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const { username } = req.body;

        const updatedUser = await User.findByIdAndUpdate(userId, { username }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Profile updated successfully', username: updatedUser.username });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update user avatar
export const updateUserAvatar = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const avatarPath = req.file.path; // Assuming the avatar is uploaded and stored in req.file

        const updatedUser = await User.findByIdAndUpdate(userId, { avatar: avatarPath }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Avatar updated successfully', avatar: updatedUser.avatar });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};