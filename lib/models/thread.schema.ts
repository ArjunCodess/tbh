import mongoose, { Schema, Document, Types } from "mongoose";

export interface Thread extends Document {
  userId: Types.ObjectId;
  title: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema: Schema<Thread> = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

ThreadSchema.pre("save", function (next) {
  if (this.isModified("slug") && typeof (this as any).slug === "string") {
    (this as any).slug = (this as any).slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

ThreadSchema.index({ userId: 1, slug: 1 }, { unique: true });
ThreadSchema.index({ userId: 1, createdAt: -1 });

const ThreadModel =
  (mongoose.models.Thread as mongoose.Model<Thread>) ||
  mongoose.model<Thread>("Thread", ThreadSchema);

export default ThreadModel;