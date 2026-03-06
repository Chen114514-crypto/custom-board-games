import { User } from '../models/User';
import { sign } from 'jsonwebtoken';
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const registerUser = async (username: string, password: string): Promise<User> => {
    const user = new User({ username, password });
    await user.save();
    return user;
};

export const loginUser = async (username: string, password: string): Promise<string | null> => {
    const user = await User.findOne({ username });
    if (user && await user.comparePassword(password)) {
        return sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    }
    return null;
};

export const getUserById = async (id: string): Promise<User | null> => {
    return await User.findById(id);
};

export const updateUser = async (id: string, updateData: Partial<User>): Promise<User | null> => {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
};