import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Message extends Document {
  content: string;
  threadId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema: Schema<Message> = new mongoose.Schema(
  {
    content: { type: String, required: true },
    threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

MessageSchema.index({ threadId: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, createdAt: -1 });
MessageSchema.index({ content: 'text' });

const MessageModel =
  (mongoose.models.Message as mongoose.Model<Message>) ||
  mongoose.model<Message>('Message', MessageSchema);

export default MessageModel;