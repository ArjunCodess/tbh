import mongoose, { Schema, Document, Types } from "mongoose";

export interface Thread extends Document {
  userId: Types.ObjectId;
  title: string;
  slug: string;
  createdAt: Date;
}

const ThreadSchema: Schema<Thread> = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

// per-user uniqueness for slug
ThreadSchema.index({ userId: 1, slug: 1 }, { unique: true });
// display ordering helper: user + createdAt desc
ThreadSchema.index({ userId: 1, createdAt: -1 });

const ThreadModel =
  (mongoose.models.Thread as mongoose.Model<Thread>) ||
  mongoose.model<Thread>("Thread", ThreadSchema);

export default ThreadModel;