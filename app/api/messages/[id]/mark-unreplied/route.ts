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
  if (!id || !isValidObjectId(id)) {
    return Response.json(
      { success: false, message: "Invalid message id" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id ?? (session as any)?.user?._id;
  if (!session || !userId) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  await connectToDatabase();

  const updateMsgRes = await MessageModel.updateOne(
    { _id: id, userId, isReplied: true },
    { $set: { isReplied: false } }
  );
  if (updateMsgRes.modifiedCount === 0) {
    const exists = await MessageModel.exists({ _id: id, userId });
    if (!exists) {
      return Response.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }
    return Response.json(
      { success: true, message: "Already unreplied" },
      { status: 200 }
    );
  }

  await UserModel.updateOne(
    { _id: userId },
    { $inc: { replyCount: -1 }, $max: { replyCount: 0 } as any }
  );

  return Response.json(
    { success: true, message: "Marked unreplied" },
    { status: 200 }
  );
}