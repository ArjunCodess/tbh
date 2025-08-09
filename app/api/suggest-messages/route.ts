import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function GET() {
  try {
    const model = google("gemini-2.0-flash");
    const prompt = `Generate three short, friendly, anonymous icebreaker questions suitable for a public profile message board.
Output format: a single line string with questions separated by '||'.
Constraints:
- Avoid sensitive topics and personal data.
- Each question should be 5-10 words.
- Questions must be engaging but neutral.
Example: What's a hobby you picked up recently?||What city would you love to explore next?||What's a film you never get tired of?`;

    const { text } = await generateText({ model, prompt });
    const cleaned = text.trim().replace(/\n/g, " ");
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

    const fallbackQuestions = [
      "what's a hobby you picked up recently?||what city would you love to explore next?||what's a film you never get tired of?",
      "what small win made your day this week?||if you could learn a skill overnight, what would it be?||what's a comfort food you always enjoy?",
      "what's a trip you'd love to plan someday?||which book or podcast inspired you lately?||what do you do to recharge?",
      "what's something new you're trying this month?||if you could chat with any creator, who would it be?||what's a simple joy you look forward to?",
    ];

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