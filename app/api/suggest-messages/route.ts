import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function GET() {
  try {
    const modelId = "gemini-2.0-flash";
    const model = google(modelId);
    const prompt = `Generate three short Gen-Z style questions for a public profile message board about crushes, love, or playful feelings.
Output format: a single line string with questions separated by '||'.
Constraints:
- Avoid sensitive topics, private data, explicit content, and naming specific people.
- Each question should be 3-8 words.
- Keep it inclusive, tasteful, and anonymous.
- Return only the questions, no quotes and no trailing punctuation.
Examples: low-key crushing on anyone?||ideal first date vibe?||what text makes you melt?`;

    function isTransientAiError(error: any): boolean {
      const status = (error as any)?.status || (error as any)?.response?.status;
      const code = (error as any)?.code;
      const name = (error as any)?.name || "";
      const message = (error as any)?.message || "";
      if (status && (status === 429 || status >= 500)) return true;
      if (code && ["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN", "ENOTFOUND"].includes(code)) return true;
      if (/RateLimit|Timeout|FetchError|NetworkError/i.test(String(name) + " " + String(message))) return true;
      return false;
    }

    async function sleep(ms: number) {
      return new Promise((r) => setTimeout(r, ms));
    }

    const maxAttempts = 3;
    const baseDelayMs = 250;
    let aiOutput: string | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const { text } = await generateText({ model, prompt, temperature: 0.7 });
        aiOutput = String(text || "").trim().replace(/\s+/g, " ");
        break;
      } catch (error: any) {
        if (!isTransientAiError(error)) throw error;
        console.warn("[suggest-messages] transient AI failure", {
          model: modelId,
          attempt,
          prompt,
          error: String(error?.message || error),
        });
        if (attempt < maxAttempts) await sleep(baseDelayMs * Math.pow(2, attempt - 1));
      }
    }

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

    const fallbackQuestions = [
      "low-key crushing on anyone?||ideal first date vibe?||what text makes you melt?",
      "what tiny green flag gets you?||how do you flirt low-key?||what makes your heart do zoomies?",
      "what's your love language rn?||who do you think about lately?||what gives you butterflies fast?",
      "late-night talk or cute coffee date?||song that reminds you of your crush?||what kind of compliments hit best?",
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