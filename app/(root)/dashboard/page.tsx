import DashboardClient from "./DashboardClient";
import type { Metadata } from "next";
import connectToDatabase from "@/lib/connectToDatabase";
import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import ThreadModel from "@/lib/models/thread.schema";
import mongoose from "mongoose";

import { ensureDailyPromptFreshForUserId } from "@/lib/services/dailyPrompt";
import MessageModel from "@/lib/models/message.schema";

export const metadata: Metadata = {
  title: "Dashboard",
};

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

  let dailyPromptText: string | null = null;
  let userId: mongoose.Types.ObjectId | null = null;
  try {
    await connectToDatabase();
    userId = new mongoose.Types.ObjectId(user._id);
    dailyPromptText = await ensureDailyPromptFreshForUserId(String(user._id));
  } catch (error) {
    console.error("[DashboardPage] Failed to connect or query database:", error);
    return (
      <div className="text-center h-screen flex items-center justify-center">
        We are experiencing issues connecting to the database. Please try again later.
      </div>
    );
  }

  const threadDocs = await ThreadModel.find({ userId }, { title: 1, slug: 1 }, { lean: true }).sort({ createdAt: -1 }).exec();
  const plainThreads = (threadDocs || []).map((t: any) => ({ _id: String(t._id), title: String(t.title), slug: String(t.slug) }));
  const ama = plainThreads.find((t) => t.slug === "ama");
  const rest = plainThreads.filter((t) => t.slug !== "ama");
  const ordered = ama ? [ama, ...rest] : rest;

  const messagesByThreadEntries = await Promise.all(
    ordered.map(async (t) => {
      try {
        const messages = await MessageModel.find({ userId, isReplied: false })
          .populate({ path: 'threadId', match: { slug: t.slug }, select: '_id slug' })
          .sort({ createdAt: -1 })
          .lean();
        const filtered = messages.filter((m: any) => m.threadId && (m as any).threadId.slug === t.slug);
        const plain = filtered.map((m: any) => ({
          _id: String(m._id),
          content: String(m.content),
          createdAt: new Date(m.createdAt),
          threadId: String((m.threadId as any)._id),
          isReplied: !!m.isReplied,
        }));
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
      dailyPrompt={dailyPromptText || ""}
      initialThreads={ordered}
      initialMessagesByThread={messagesByThread}
    />
  );
}