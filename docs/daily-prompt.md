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
- template v1
  - intent: one short, friendly daily reflection question suitable for a public profile.
  - constraints: 8–16 words, neutral, no sensitive/personal data, lowercase preferred, no trailing punctuation.
  - prompt body:
    - "generate one short, friendly daily reflection question for a public message board.\nconstraints:\n- 8 to 16 words\n- avoid sensitive topics and private data\n- neutral, inclusive tone\n- return only the question text, no quotes or punctuation at end"
- normalization and fallback
  - trim and collapse whitespace; enforce max 120 chars; strip trailing punctuation.
  - on failure (2 retries): pick deterministic fallback from a static list using hash of `userId + yyyy-mm-dd`.
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