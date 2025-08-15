export const DAILY_PROMPT_TEMPLATE = [
  "Generate one short, playful Gen-Z style question for a public message board about crushes, love, or feelings.",
  "Constraints:",
  "- 4 to 10 words",
  "- avoid sensitive topics, private data, explicit content, and naming specific people",
  "- no age-related content; keep it inclusive and tasteful",
  "- return only the question text, no quotes and no trailing punctuation",
].join("\n");

export const SUGGEST_MESSAGES_TEMPLATE = `Generate three short Gen-Z style questions for a public profile message board about crushes, love, or playful feelings.
Output format: a single line string with questions separated by '||'.
Constraints:
- Avoid sensitive topics, private data, explicit content, and naming specific people.
- Each question should be 3-8 words.
- Keep it inclusive, tasteful, and anonymous.
- Return only the questions, no quotes and no trailing punctuation.
Examples: low-key crushing on anyone?||ideal first date vibe?||what text makes you melt?`;

export const GENZ_FALLBACK_DAILY = [
  "what tiny thing gives you butterflies?",
  "what's your love language lately?",
  "what kind of texts make you melt?",
  "what first-date vibe do you love?",
  "what makes you catch feelings fast?",
];

export const GENZ_FALLBACK_SUGGESTIONS = [
  "low-key crushing on anyone?||ideal first date vibe?||what text makes you melt?",
  "what tiny green flag gets you?||how do you flirt low-key?||what makes your heart do zoomies?",
  "what's your love language rn?||who do you think about lately?||what gives you butterflies fast?",
  "late-night talk or cute coffee date?||song that reminds you of your crush?||what kind of compliments hit best?",
];