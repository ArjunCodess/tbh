## threads — implementation plan

inspired by ngl “games”, we will let users pick a thread (default: "ask me anything") to categorize incoming questions. threads are selectable on the public profile via a dropdown and are displayed as separated sections on the dashboard.

### goals
- **threads on dashboard**: show separated sections for each thread
- **default**: "ask me anything" remains the default everywhere
- **profile selector**: add a dropdown ("dropper") bound to `?q` to select thread
- **db**: introduce `Thread` and link `Message` to a thread; write a backfill migration
- **image api**: support custom titles via `?reply=...` (use provided question in place of the static title)

### conventions
- **canonical default thread**
  - name: "ask me anything"
  - slug: `ama`
- **profile url parameter**: `?thread=<thread-slug>` with fallback to `ama`
- **display order**: default thread first, then most recently created

### phase 1 — database changes
- add `Thread` schema
  - fields: `_id`, `userId` (ref `User`), `title` (string), `slug` (string, per-user unique), `createdAt` (date)
  - indexes: `{ userId: 1, slug: 1 }` unique; `{ userId: 1, createdAt: -1 }`
- update `Message` schema
  - add `threadId: ObjectId` (ref `Thread`) required
  - index: `{ threadId: 1, createdAt: -1 }`
- migration/backfill
  - for each user: create (or find) default `Thread { title: "ask me anything", slug: "ama" }`
  - set `message.threadId = defaultThread._id` for all existing messages for that user
  - idempotent: safe to re-run

### phase 2 — apis
- `GET /api/threads` → list threads for the authenticated user
- `POST /api/threads` → create a thread `{ title }` (slug derived; per-user uniqueness enforced)
- update `GET /api/get-messages`
  - accept optional `threadId` or `threadSlug` query to filter
  - default: return messages for default thread when not provided
- update `POST /api/send-message`
  - accept `threadSlug` (or `threadId`) in body or query; resolve to a thread for the target user
  - default to the user’s `ama` thread when not provided

### phase 3 — dashboard ui
- `app/(root)/dashboard/page.tsx`
  - fetch threads via `/api/threads`
  - for each thread, fetch messages filtered by that thread and render a distinct section
  - section header = thread title; keep existing message card grid inside each section
  - keep existing controls (copy link, accept messages, refresh, share)

### phase 4 — profile ui
- `app/(root)/profile/[username]/page.tsx`
  - add a dropdown to pick the thread; default selection = "ask me anything"
  - pass the selected thread along to `MessageForm` (and ultimately to `POST /api/send-message`)
  - server-render threads list for the profile user; the dropdown itself can be a tiny client component wrapped in `Suspense`

### phase 5 — question image api
- `app/api/reply-image-generation/route.tsx`
  - already supports `?reply=...`
  - usage: supply the current thread’s title as `q` to replace the prior static label
  - example: `/api/reply-image-generation?thread=${encodeURIComponent(currentThreadTitle)}`

### phase 6 — sign-up defaulting
- when a new user signs up, automatically create the default `ama` thread

### rollout plan
1) ship db schemas + migration (backfill)
2) ship apis (threads list/create, message filtering)
3) wire dashboard sections per thread
4) wire profile dropdown and send-message plumbing
5) hook thread title to image api param

### todo list
- [x] add `Thread` schema, indexes, and model
- [x] add `threadId` to `Message` schema with index
- [x] write migration to create default `ama` thread per user and backfill messages
- [x] add `/api/threads` (get, post) for authenticated users
- [x] update `/api/get-messages` to accept `threadId`/`threadSlug` filter with default fallback
- [x] update `/api/send-message` to accept and apply `threadSlug` (default `ama`)
- [x] add profile dropdown bound to `?thread=<slug>`; default to `ama`
- [x] pass selected thread to `MessageForm` and send-message request
- [x] update dashboard to render separated sections per thread
- [x] integrate thread title with `/api/reply-image-generation?reply=...&`
- [x] create default thread at sign-up time