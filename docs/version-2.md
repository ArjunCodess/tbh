## tbh v2 — roadmap and migration plan

### goals

- **framework upgrade**: migrate to next.js 15
- **ai suggestions**: use ai sdk + gemini to generate contextual suggested questions and suggested answers
- **ux overhaul**: redesign share qna flow to be beautiful, responsive, and easy to export/share
- **multi q&a**: support multiple question and answers simultaneously (threads/conversations)

### architecture changes

- **ai (gemini via ai sdk)**
  - add an ai service module for suggestion generation
  - streaming text generation for suggestions
  - inputs: recipient persona or prior messages; outputs: top n suggested questions and possible answers
- **data model**
  - introduce `Thread` (multi q&a) with `messages[]` containing question/answer entries, timestamps, owner and visibility flags
  - backfill and migration scripts to map existing single messages into default thread
- **ui/ux**
  - redesign `/dashboard/share-qna` with clear presets, theme selection, and preview canvas
  - thread view for multi q&a with reply composer

### apis (planned)

- `POST /api/ai/suggest`: returns `questions[]`, `answers[]` using gemini
- `GET/POST /api/threads`, `GET /api/threads/:id`, `POST /api/threads/:id/reply`, `DELETE /api/threads/:id`

### risks and mitigations

- auth switch regression → run in feature-flagged dual mode briefly, add integration tests
- ai costs/latency → cache suggestions per user, debounce requests, small prompt templates
- data migration safety → back up db, idempotent migration script, dry run first

### acceptance criteria

- next.js 15 app builds, runs, and pages render
- ai suggestions visible on `/u/[username]` with fallback when disabled
- thread view supports multiple q&a entries under a conversation
- share qna page is redesigned and can export/share images cleanly

### todos

| Done | Step                       | Task                                                                                               |
| ---- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| ✅   | 1. prepare                 | add feature flags: `USE_AI_SUGGESTIONS`                                                            |
| ✅   | 2. next.js 15 upgrade      | upgrade `next`, `react`, `eslint-config-next`; address breaking changes (web/edge runtime, config) |
| ✅   | 2. next.js 15 upgrade      | validate build and middleware behavior                                                             |
| ✅   | 3. ai suggestions (gemini) | add ai sdk and gemini provider                                                                     |
| ✅   | 3. ai suggestions (gemini) | implement `POST /api/ai/suggest` endpoint returning structured { questions[], answers[] }          |
| ✅   | 3. ai suggestions (gemini) | update profile send page to consume ai suggestions with graceful fallback to static                |
| ✅   | 4. data model evolution    | create `Thread` schemas; add indexes                                                               |
| ✅   | 4. data model evolution    | write migration to move existing `User.messages[]` into `Thread`                                   |
| ✅   | 4. data model evolution    | implement `GET/POST` apis for threads                                                              |
| ✅   | 5. share qna redesign      | create a new `/dashboard/share-qna` rsc-first page with client preview component lazily loaded     |
| ✅   | 5. share qna redesign      | add export to image and share; improve typography and themes                                       |
| ✅   | 6. cleanup                 | remove compatibility layer and flags; delete unused routes                                         |