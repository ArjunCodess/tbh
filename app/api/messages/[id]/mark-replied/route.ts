import connectToDatabase from "@/lib/connectToDatabase";
import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import MessageModel from "@/lib/models/message.schema";
import UserModel from "@/lib/models/user.schema";
import { isValidObjectId } from "mongoose";

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

  const message = await MessageModel.findOne({ _id: id, userId: user._id });
  if (!message) {
    return Response.json(
      { success: false, message: "Message not found" },
      { status: 404 }
    );
  }

  if (!message.isReplied) {
    await MessageModel.updateOne(
      { _id: id, userId: user._id },
      { $set: { isReplied: true } }
    );

    await UserModel.updateOne(
      { _id: user._id },
      { $inc: { replyCount: 1 } }
    );
  }

  return Response.json(
    { success: true, message: "Marked replied" },
    { status: 200 }
  );
}