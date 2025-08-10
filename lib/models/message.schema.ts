import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Message extends Document {
     content: string;
     createdAt: Date;
     threadId: Types.ObjectId;
}

export interface MessageData extends Document {
     messages: Message;
}

export const MessageSchema: Schema<Message> = new mongoose.Schema({
     content: { type: String, required: true },
     createdAt: { type: Date, required: true, default: Date.now },
     threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
});

MessageSchema.index({ threadId: 1, createdAt: -1 });

const MessageModel = (mongoose.models.Message as mongoose.Model<Message>) || mongoose.model<Message>('Message', MessageSchema);

export default MessageModel;