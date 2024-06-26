import mongoose, { Schema, Document } from 'mongoose';
import { Message, MessageSchema } from './message.schema';

export interface User extends Document {
     username: string;
     email: string;
     password: string;
     isAcceptingMessages: boolean;
     messages: Message[];
}

const UserSchema: Schema<User> = new mongoose.Schema({
     username: { type: String, required: [true, 'Username is required'], trim: true, unique: true, },
     email: { type: String, required: [true, 'Email is required'], unique: true, match: [/.+\@.+\..+/, 'Please use a valid email address'], },
     password: { type: String, required: [true, 'Password is required'], },
     isAcceptingMessages: { type: Boolean, default: true, },
     messages: [ MessageSchema ],
});

const UserModel = mongoose.models.User as mongoose.Model<User> || mongoose.model<User>('User', UserSchema);

export default UserModel;