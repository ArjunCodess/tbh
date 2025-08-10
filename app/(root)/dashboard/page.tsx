import DashboardClient from "./DashboardClient";
import connectToDatabase from "@/lib/connectToDatabase";
import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import ThreadModel from "@/lib/models/thread.schema";
import mongoose from "mongoose";

import UserModel from "@/lib/models/user.schema";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as any;
  if (!session || !user) {
    return (
      <div className="text-center h-screen flex items-center justify-center">
        You must sign in to view the dashboard.
      </div>
    );
  }

  let acceptMessages = false;
  let userId: mongoose.Types.ObjectId | null = null;
  try {
    await connectToDatabase();
    userId = new mongoose.Types.ObjectId(user._id);
    const foundUser = await UserModel.findById(userId, { isAcceptingMessages: 1 }).lean();
    acceptMessages = !!foundUser?.isAcceptingMessages;
  } catch (error) {
    console.error("[DashboardPage] Failed to connect or query database:", error);
    return (
      <div className="text-center h-screen flex items-center justify-center">
        We are experiencing issues connecting to the database. Please try again later.
      </div>
    );
  }

  const threadDocs = await ThreadModel.find({ userId }, { title: 1, slug: 1 }, { lean: true }).sort({ createdAt: -1 }).exec();
  const plainThreads = (threadDocs || []).map((t: any) => ({ title: String(t.title), slug: String(t.slug) }));
  const ama = plainThreads.find((t) => t.slug === "ama");
  const rest = plainThreads.filter((t) => t.slug !== "ama");
  const ordered = ama ? [ama, ...rest] : rest;

  const messagesByThreadEntries = await Promise.all(
    ordered.map(async (t) => {
      try {
        const pipeline: any[] = [
          { $match: { _id: userId } },
          { $unwind: "$messages" },
          { $match: { "messages.threadId": { $exists: true } } },
          { $lookup: { from: "threads", localField: "messages.threadId", foreignField: "_id", as: "threadRef" } },
          { $unwind: "$threadRef" },
          { $match: { "threadRef.slug": t.slug } },
          { $sort: { "messages.createdAt": -1 } },
          { $group: { _id: "$_id", messages: { $push: "$messages" } } },
        ];
        const result = await UserModel.aggregate(pipeline).exec();
        const messages = (result?.[0]?.messages || []) as any[];
        const plain = messages.map((m) => ({
          _id: String(m._id),
          content: String(m.content),
          createdAt: new Date(m.createdAt),
          threadId: String(m.threadId),
        })) as any;
        return [t.slug, plain] as const;
      } catch (error) {
        console.error(`Failed to fetch messages for thread ${t.slug}:`, error);
        return [t.slug, []] as const;
      }
    })
  );
  const messagesByThread = Object.fromEntries(messagesByThreadEntries);
  return (
    <DashboardClient
      username={String(user.username)}
      initialAcceptMessages={acceptMessages}
      initialThreads={ordered}
      initialMessagesByThread={messagesByThread}
    />
  );
}