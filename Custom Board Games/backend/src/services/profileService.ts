import { User } from '../models/User';
import { Board } from '../models/Board';

export class ProfileService {
  async getUserProfile(userId: string) {
    const user = await User.findById(userId).populate('boards');
    if (!user) {
      throw new Error('User not found');
    }
    return {
      username: user.username,
      avatar: user.avatar,
      boards: user.boards,
    };
  }

  async updateUserProfile(userId: string, updateData: { username?: string; avatar?: string }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (updateData.username) {
      user.username = updateData.username;
    }

    if (updateData.avatar) {
      user.avatar = updateData.avatar;
    }

    await user.save();
    return {
      username: user.username,
      avatar: user.avatar,
    };
  }

  async getUserBoards(userId: string) {
    const user = await User.findById(userId).populate('boards');
    if (!user) {
      throw new Error('User not found');
    }
    return user.boards;
  }
}