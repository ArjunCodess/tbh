import connectToDatabase from "@/lib/connectToDatabase";
import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import MessageModel from "@/lib/models/message.schema";
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

  const res = await MessageModel.updateOne(
    { _id: id, userId: user._id },
    { $set: { isReplied: true } }
  );
  if (res.matchedCount === 0)
    return Response.json(
      { success: false, message: "Message not found" },
      { status: 404 }
    );
  return Response.json(
    { success: true, message: "Marked replied" },
    { status: 200 }
  );
}