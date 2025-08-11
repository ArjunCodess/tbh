import mongoose, { Schema, Document } from 'mongoose';

export interface UsernameRedirect extends Document {
  oldUsername: string;
  newUsername: string;
  userId: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const UsernameRedirectSchema = new Schema<UsernameRedirect>(
  {
    oldUsername: { type: String, required: true, unique: true },
    newUsername: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collation: { locale: 'en', strength: 2 } }
);

UsernameRedirectSchema.index({ oldUsername: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const UsernameRedirectModel =
  (mongoose.models.UsernameRedirect as mongoose.Model<UsernameRedirect>) ||
  mongoose.model<UsernameRedirect>('UsernameRedirect', UsernameRedirectSchema);

export default UsernameRedirectModel;