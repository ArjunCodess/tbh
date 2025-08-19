import connectToDatabase from "@/lib/connectToDatabase";
import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import MessageModel from "@/lib/models/message.schema";
import UserModel from "@/lib/models/user.schema";
import mongoose, { isValidObjectId } from "mongoose";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json(
      { success: false, message: "Invalid message id" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!session || !user)
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );

  await connectToDatabase();

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const messageUpdate = await MessageModel.updateOne(
      { _id: id, userId: user._id, isReplied: false },
      { $set: { isReplied: true } },
      { session: mongoSession }
    );

    if (messageUpdate.modifiedCount === 0) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();

      const existing = await MessageModel.findOne({ _id: id, userId: user._id });
      if (!existing) {
        return Response.json(
          { success: false, message: "Message not found" },
          { status: 404 }
        );
      }

      return Response.json(
        { success: true, message: "Already replied" },
        { status: 200 }
      );
    }

    await UserModel.updateOne(
      { _id: user._id },
      { $inc: { replyCount: 1 } },
      { session: mongoSession }
    );

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return Response.json(
      { success: true, message: "Marked replied" },
      { status: 200 }
    );
  } catch (err) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();

    console.error("Error marking message as replied:", err);
    return Response.json(
      { success: false, message: "Error marking message as replied" },
      { status: 500 }
    );
  }
}