### 1. Goal (1–2 lines)
- Add robust “replied / unreplied” state so users can filter inbox and prioritize unanswered items.
- Support auto-mark on owner replies, manual mark/unmark, and fast server-side filtering.

### 2. Data model changes (schema diff + short rationale)
- Where (preferred): `lib/models/thread.schema.ts`
  - Add fields:
    - `isReplied: boolean` (default: false)
    - `repliedAt: Date | null` (default: null)
    - `repliedBy: Types.ObjectId | null` (ref `User`, default: null)
    - `manuallyMarked: { by: Types.ObjectId; at: Date } | null` (default: null)
  - Indexes:
    - `({ userId: 1, isReplied: 1, createdAt: -1 })` for owner-scoped filtered pagination
    - `({ isReplied: 1, createdAt: -1 })` for potential admin/global analytics
- Optional (forward-compat) in `lib/models/message.schema.ts`:
  - Add `isOwnerReply: boolean` (default: false) or `authorRole: 'owner' | 'visitor'` to distinguish messages for auto-marking logic.
- Rationale: Thread-level flags enable O(1) filter without per-request aggregation; message-level flag enables auto-mark and recomputation.

### 3. Migration plan (stepwise, no code)
- Add new fields with defaults and new indexes to `Thread` (and `Message.isOwnerReply` if adopted).
- Scan existing threads/messages:
  - For each thread owned by `userId`, compute: if any message in thread has `isOwnerReply=true` → set `isReplied=true`, `repliedAt=latestOwnerReply.createdAt`, `repliedBy=userId`, clear `manuallyMarked`.
  - Otherwise: set `isReplied=false`, null out reply fields.
- Single-message fallback: if any message lacks a thread, create a synthetic thread per message (slug from message `_id`), re-associate message, then apply same logic.
- Dry run: run aggregation to count total threads, total with owner replies, and prospective updates; log metrics and sample IDs.
- Run live migration off-peak; batch with `limit/skip` and `ordered: false`; write idempotently based on computed target values so it’s safe to re-run.
- Backups: snapshot DB or export thread/message collections; track progress with a `migrations` log doc.

### 4. Backend behavior & API surface
- Threads listing: extend `GET /api/threads` (file: `app/api/threads/route.ts`) to accept `filter=replied|unreplied|all` and sort/pagination params; apply `{ userId, ...(filter) }` using new indexes.
- Manual toggle:
  - `POST /api/threads/:id/mark-replied` → sets `isReplied=true`, `repliedAt=now`, `repliedBy=ownerId`, `manuallyMarked={ by, at }`.
  - `POST /api/threads/:id/mark-unreplied` → sets `isReplied=false`, clears `repliedAt`, `repliedBy`, `manuallyMarked`.
- Auto-mark:
  - On owner replying (future reply endpoint) or when creating a `Message` with `isOwnerReply=true`: upsert thread flags with `repliedAt=message.createdAt` if newer; do not overwrite `manuallyMarked` unless transitioning to true.
  - Concurrency: use atomic update with `$max` on `repliedAt` and conditional set on `isReplied`.
- Authorization: only the thread owner (session `user._id`) can list with filters for their threads and mark/unmark; visitors cannot mutate flags.
- Deletion hooks:
  - If owner deletes a reply message, recompute thread flags (aggregation: latest remaining owner reply); if none, set `isReplied=false`.

### 5. Frontend UX & placement (concise)
- Dashboard header (`app/(root)/dashboard/DashboardClient.tsx`):
  - Add a global filter control (“All / Unreplied / Replied”) synced to `?filter=` in URL; feed through to `/api/threads` call.
- Thread list:
  - Show an “Unreplied” badge on threads with `isReplied=false`; small “Replied · 2h ago” pill on replied ones.
  - Per-thread overflow menu: “Mark replied / Mark unreplied”.
  - Optional bulk action: “Mark all replied” (calls batch mark endpoint).
- Message composer (owner reply flow, future):
  - After successful reply, optimistically update thread pill to “Replied” and re-fetch.
- `ThreadDropdown`:
  - Preserve `q` behavior; add `filter` query param to maintain shareable views.

### 6. Edge cases & rules (short)
- Owner deletes their reply → recompute thread reply state; if no owner replies remain, revert to `isReplied=false`.
- Multiple owner replies → keep `repliedAt` as the latest owner reply time.
- Manual mark vs auto: preserve `manuallyMarked` to distinguish in analytics; auto-mark should not clear manual unless transitioning states.
- Soft-deleted messages (if introduced) must be excluded from reply computation; current hard deletes are already excluded.
- Thread slug changes or merges retain flags on the target thread; recompute if messages move.

### 7. Performance & monitoring (1–2 bullets)
- Use the new compound indexes; paginate thread list; avoid N+1 by not deriving flags at request time.
- Emit metrics: `count_unreplied_by_user`, `mark_actions_total{mode=manual|auto}`, and migration counters; add minimal logs for slow queries.

### 8. Rollout plan (short)
- Feature-flag server filter + manual mark endpoints; ship schema and indexes first.
- Run migration behind the flag; validate with dry-run counts; enable for a small cohort; monitor metrics and error rates; then full rollout.
- Public profile routes (`/u/...`) remain unchanged.

Produce a concise doc following this outline.

- Added precise placements for schema, API, and UI changes (`lib/models/thread.schema.ts`, `app/api/threads/route.ts`, `app/(root)/dashboard/DashboardClient.tsx`, `components/ThreadDropdown.tsx`).
- Covered indexes, migration steps (idempotent), endpoints for filter and marking, and minimal UX changes with URL-based filter state.