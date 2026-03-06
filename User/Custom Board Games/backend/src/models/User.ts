import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
  username: string;
  avatar: string;
  boards: string[];
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  avatar: { type: String, default: 'uploads/avatars/default.png' },
  boards: [{ type: String, ref: 'Board' }]
}, { timestamps: true });

const User = model<IUser>('User', userSchema);

export default User;