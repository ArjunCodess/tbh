import { NextResponse } from "next/server";
import { generateWithRetry } from "@/lib/ai/generation";
import { SUGGEST_MESSAGES_TEMPLATE, GENZ_FALLBACK_SUGGESTIONS } from "@/lib/ai/prompts";

export async function GET() {
  try {
    const aiOutput = await generateWithRetry(SUGGEST_MESSAGES_TEMPLATE, {
      temperature: 0.7,
      maxAttempts: 3,
      baseDelayMs: 250,
      context: "suggest-messages",
    });
    const cleaned = String(aiOutput || "").trim().replace(/\s+/g, " ");
    if (cleaned.includes("||") && cleaned.length < 500) {
      return NextResponse.json(
        {
          message: "Messages generated successfully",
          success: true,
          questions: cleaned,
        },
        { status: 200 }
      );
    }

    const fallbackQuestions = GENZ_FALLBACK_SUGGESTIONS;

    const randomQuestions =
      fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

    return NextResponse.json(
      {
        message: "Messages generated successfully",
        success: true,
        questions: randomQuestions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("An unexpected error occurred:", error);
    return NextResponse.json(
      { message: "Error in suggesting messages", success: false },
      { status: 500 }
    );
  }
}