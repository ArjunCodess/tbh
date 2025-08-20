## daily ai-generated prompt — implementation spec

### system architecture

- frontend (next.js 15)
  - use server components. in `app/(root)/dashboard/page.tsx`, fetch `dailyPrompt` from mongodb via mongoose on the server and render.
  - no client-side fetching; wrap any client UI shells in `Suspense` with a simple fallback if needed.
- backend
  - authentication: extend `next-auth` `events.signIn` in `app/api/auth/[...nextauth]/options.ts` to refresh the prompt on login.
  - api: `GET /api/daily-prompt` (auth required) returns current prompt; regenerates if stale (same logic as login) for deep links.
- database (mongodb + mongoose)
  - store prompt on `User` document as `dailyPrompt` subdocument.
  - fields: `text: string`, `updatedAt: Date`, `model: string`, `promptVersion: number`.
- integrations
  - ai sdk `generateText` with `@ai-sdk/google` model `gemini-2.0-flash` (consistent with `app/api/suggest-messages`).

### prompt generation logic

- provider and call
  - `const model = google("gemini-2.0-flash");`
  - `const { text } = await generateText({ model, prompt, temperature: 0.7, maxTokens: 40 });`
- template
  - intent: one short, playful Gen‑Z style question about crushes, love, or light feelings suitable for a public profile.
  - constraints: 4–10 words, inclusive, avoid sensitive/personal data, no explicit content, no naming real people, no trailing punctuation.
  - prompt body:
    - "Generate one short, playful Gen-Z style question for a public message board about crushes, love, or feelings.\nConstraints:\n- 4 to 10 words\n- avoid sensitive topics, private data, explicit content, and naming specific people\n- no age-related content; keep it inclusive and tasteful\n- return only the question text, no quotes and no trailing punctuation"
- normalization and fallback
  - trim and collapse whitespace; enforce max 120 chars; strip trailing punctuation; if empty, throw "empty ai response".
  - retries: up to 3 attempts with exponential backoff (250ms, 500ms) for transient errors; log attempt, model, and prompt on each failure.
  - on final failure: deterministic fallback from a Gen‑Z themed list using hash of `userId + yyyy-mm-dd`.
- scheduling
  - update on user login: compare `dailyPrompt.updatedAt` to current utc day start. if stale or null → regenerate and set new `updatedAt`.
  - same stale-check in `GET /api/daily-prompt` so direct hits refresh if necessary.

### storage of prompts (schema, indexing, caching)

- schema (in `lib/models/user.schema.ts`)
  - `dailyPrompt: {`
  - `  text: { type: String, default: "" },`
  - `  updatedAt: { type: Date, default: null },`
  - `  promptVersion: { type: Number, default: 1 },`
  - `}`
  - extend `User` interface accordingly.
- indexing
  - add `{ "dailyPrompt.updatedAt": -1 }` for efficient scans and sorting.
  - keep `{ username: 1 }` for lookups.
- caching strategy
  - authenticated route: set `Cache-Control: no-store`.
  - in-process dedupe: short-lived `Map<userId, expiresAt>` (≈60s) to coalesce concurrent regenerations per user.
- updatedAt usage
  - utc day boundary comparison determines staleness; on regeneration set `dailyPrompt.updatedAt = now`.

put the “Daily AI-Generated Prompts” above the “ask me anything” section — right after the search bar/add Thread area and before the thread headings.