import mongoose, { Schema, Document } from 'mongoose';

export interface User extends Document {
  username: string;
  email: string;
  password: string;
  isAcceptingMessages: boolean;
  displayName?: string;
  profileColor?: string;
  textColor?: string;
  replyCount?: number;
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
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [/.+@.+\..+/, 'Please use a valid email address'],
    },
    password: { type: String, required: [true, 'Password is required'] },
    isAcceptingMessages: { type: Boolean, default: true },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'display name must be <= 50 characters'],
      default: function () {
        return (this as any).username;
      },
    },
    profileColor: {
      type: String,
      required: true,
      default: '#111827',
      validate: {
        validator: (v: string) => /^#(?:[0-9a-fA-F]{6})$/.test(v),
        message: 'profile color must be a 6-digit hex like #RRGGBB',
      },
    },
    textColor: {
      type: String,
      required: true,
      default: '#FFFFFF',
      validate: {
        validator: (v: string) => /^#(?:[0-9a-fA-F]{6})$/.test(v),
        message: 'text color must be a 6-digit hex like #RRGGBB',
      },
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dailyPrompt: {
      text: { type: String, default: '' },
      updatedAt: { type: Date, default: null },
      promptVersion: { type: Number, default: 1 },
    },
  },
  { timestamps: true, collation: { locale: 'en', strength: 2 } }
);

UserSchema.index({ 'dailyPrompt.updatedAt': -1 });
UserSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>('User', UserSchema);

export default UserModel;