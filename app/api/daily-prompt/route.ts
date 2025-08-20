import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import { ensureDailyPromptFreshForUserId } from "@/lib/services/dailyPrompt";
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  
  if (!user) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }
  
  const userId = user._id ?? user.id;
  if (!userId) {
    return NextResponse.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  try {
    const text = await ensureDailyPromptFreshForUserId(String(userId));
    return NextResponse.json({ success: true, prompt: text }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "failed" }, { status: 500 });
  }
}