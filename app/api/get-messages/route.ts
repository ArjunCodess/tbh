import mongoose from "mongoose";
import connectToDatabase from "@/lib/connectToDatabase";
import { getServerSession, type Session } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import ThreadModel from "@/lib/models/thread.schema";
import UserModel from "@/lib/models/user.schema";
import { NextRequest } from "next/server";
import MessageModel from "@/lib/models/message.schema";

interface SessionUser {
  _id: string;
  id?: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AuthSession extends Session {
  user?: SessionUser | null;
}

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const session = (await getServerSession(authOptions)) as AuthSession | null;
  const _user = session?.user;

  if (!session || !_user)
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );

  const userId = new mongoose.Types.ObjectId(_user._id);

  const { searchParams } = new URL(req.url);
  const threadSlug = searchParams.get("threadSlug");
  const threadIdParam = searchParams.get("threadId");

  let targetThreadId: mongoose.Types.ObjectId | null = null;
  if (threadIdParam && mongoose.isValidObjectId(threadIdParam)) {
    targetThreadId = new mongoose.Types.ObjectId(threadIdParam);
  } else {
    const slug = threadSlug || "ama";
    const thread = await ThreadModel.findOne(
      { userId, slug },
      { _id: 1 }
    ).lean();
    if (thread) targetThreadId = new mongoose.Types.ObjectId(thread._id as any);
  }

  try {
    const criteria: any = { userId };
    if (targetThreadId) criteria.threadId = targetThreadId;

    const messages = await MessageModel.find(criteria)
      .sort({ createdAt: -1 })
      .lean();

    if (messages.length > 0) {
      return Response.json(
        { messages, success: true, message: 'OK' },
        { status: 200 }
      );
    }

    // Fallback: legacy embedded messages (pre-migration)
    const pipeline: any[] = [
      { $match: { _id: userId } },
      { $unwind: "$messages" },
    ];
    if (targetThreadId) pipeline.push({ $match: { "messages.threadId": targetThreadId } });
    pipeline.push(
      { $sort: { "messages.createdAt": -1 } },
      { $group: { _id: "$_id", messages: { $push: "$messages" } } }
    );
    const legacy = await UserModel.aggregate(pipeline).exec();
    const legacyMessages = legacy?.[0]?.messages || [];
    return Response.json({ messages: legacyMessages, success: true, message: 'OK' }, { status: 200 });
  } catch (error: any) {
    console.error("An unexpected error occurred: ", error);
    return Response.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}