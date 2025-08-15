import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import { ensureDailyPromptFreshForUserId } from "@/lib/services/dailyPrompt";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as any;
  if (!user) {
    return Response.json({ success: false, message: "unauthorized" }, { status: 401 });
  }

  try {
    const text = await ensureDailyPromptFreshForUserId(String(user._id));
    return Response.json({ success: true, prompt: text }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return Response.json({ success: false, message: err?.message || "failed" }, { status: 500 });
  }
}