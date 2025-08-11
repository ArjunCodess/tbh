import mongoose, { Schema, Document } from 'mongoose';

export interface User extends Document {
  username: string;
  email: string;
  password: string;
  isAcceptingMessages: boolean;
  dailyPrompt?: {
    text: string;
    updatedAt: Date | null;
    promptVersion: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<User> = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [/.+@.+\..+/, 'Please use a valid email address'],
    },
    password: { type: String, required: [true, 'Password is required'] },
    isAcceptingMessages: { type: Boolean, default: true },
    dailyPrompt: {
      text: { type: String, default: '' },
      updatedAt: { type: Date, default: null },
      promptVersion: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

UserSchema.index({ 'dailyPrompt.updatedAt': -1 });

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>('User', UserSchema);

export default UserModel;