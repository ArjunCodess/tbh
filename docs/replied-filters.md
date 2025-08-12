## quick filters (replied / unreplied) — technical specification

### goals

- **introduce a global quick filter** on the dashboard to switch between Unreplied, Replied, and All views.
- **apply the filter to both threads and messages**:
  - when viewing Unreplied, hide threads marked replied and hide messages marked replied.
  - when viewing Replied, show only threads marked replied and only messages marked replied.
  - All shows everything.
- **default selection = Unreplied** across all relevant inbox/message views.
- **auto-mark message as replied** after a successful “Share to Story”; provide **manual toggles** to mark/unmark replied for both messages and threads.
 - **auto-mark message as replied** after a successful “Share to Story” or successful in-thread reply action; provide **manual toggles** to mark/unmark replied for both messages and threads.
- **counts shown per thread are filtered counts** (e.g., Unreplied count when Unreplied filter is active). counts must be returned by `/api/threads` to avoid N calls to `/api/get-messages`.
- **mongodb** is the database; include **migration** to add fields and indexes as needed.
- **no multi-user complexity**: only the owner can see/modify.

### definitions

- **message.replied**: a boolean flag `isReplied` that indicates the owner considers this message “archived/handled”. when `true`, it should be hidden in the Unreplied view by default.
- **thread.replied**: a boolean flag `isReplied` that indicates the entire thread is “archived/handled”. a thread can be marked replied even if some messages inside are not replied. this is intentional to let users “throw the thread out of sight”.
- the **global filter** applies to both levels:
  - Unreplied: show only threads where `thread.isReplied = false`; within them, show only messages where `message.isReplied = false`.
  - Replied: show only threads where `thread.isReplied = true`; within them, show only messages where `message.isReplied = true`.
  - All: show all threads and all messages.

### data model changes (mongodb)

- `lib/models/message.schema.ts`
  - add: `isReplied: { type: Boolean, required: true, default: false, index: true }`.
  - indexes:
    - keep existing: `{ threadId: 1, createdAt: -1 }`, `{ content: 'text' }`.
    - add compound for filtered retrieval: `{ userId: 1, isReplied: 1, createdAt: -1 }`.
    - add within-thread filtered retrieval: `{ threadId: 1, isReplied: 1, createdAt: -1 }`.

- `lib/models/thread.schema.ts`
  - add: `isReplied: { type: Boolean, required: true, default: false, index: true }`.
  - indexes:
    - keep existing: `{ userId: 1, slug: 1 } (unique)`, `{ userId: 1, createdAt: -1 }`.
    - add compound for filtered lists: `{ userId: 1, isReplied: 1, createdAt: -1 }`.

notes:
- do not add `repliedAt` at this time per requirement. the simplest boolean is sufficient.
- ensure new schema fields are non-breaking and default to `false`.

### migration plan

- create `lib/migrations/addRepliedFlags.ts` that performs the following:
  - for `Message` collection: `updateMany({ isReplied: { $exists: false } }, { $set: { isReplied: false } })`.
  - for `Thread` collection: `updateMany({ isReplied: { $exists: false } }, { $set: { isReplied: false } })`.
  - create indexes listed above (background builds). if using mongoose `schema.index`, ensure application start also creates these; the migration should explicitly create them too to avoid relying on app boot.
  - do not touch legacy embedded messages inside `User`. filtering won’t apply to the legacy fallback path.

- add runner script `scripts/run-add-replied-flags.ts` mirroring existing migration runners. it should:
  - connect to db
  - invoke the migration
  - log counts and time
  - exit cleanly

- idempotency:
  - the migration should be safe to run multiple times. use `$exists: false` checks; index creation should be no-op if already present.

### backend api changes

#### 1) get messages (existing): `GET /api/get-messages`

- add query param `filter` with allowed values: `unreplied` | `replied` | `all` (default: `unreplied`).
- existing params remain (e.g., `threadSlug`, `threadId`).
- behavior:
  - build `criteria` base: `{ userId, ...(threadId? { threadId } : {}) }`.
  - apply filter:
    - `unreplied` → add `{ isReplied: false }`.
    - `replied` → add `{ isReplied: true }`.
    - `all` → no `isReplied` clause.
  - sort remains `{ createdAt: -1 }`.
  - legacy fallback: only used when the primary `Message` query returns 0 items. fallback returns messages from embedded legacy array without `isReplied` filtering (we are not modifying legacy data by design). document this caveat in handler comments.

#### 2) list threads (existing): `GET /api/threads`

- add query param `filter`: `unreplied` | `replied` | `all` (default: `unreplied`).
- response remains `{ success: true, threads: Thread[] }`, but each array item now includes a `count` field that represents the **message count filtered by the same `filter`**:
  - if `unreplied`, count = number of messages with `{ threadId, isReplied: false }`.
  - if `replied`, count = number of messages with `{ threadId, isReplied: true }`.
  - if `all`, count = total messages by `threadId`.
- thread-level filtering:
  - `unreplied`: include only threads where `thread.isReplied = false`.
  - `replied`: include only threads where `thread.isReplied = true`.
  - `all`: include all.
- implementation details:
  - fetch threads by `{ userId, ...(filter !== 'all' ? { isReplied: filter === 'replied' } : {}) }`, sorted by `{ createdAt: -1 }`, and keep “ama” first.
  - compute counts via a single aggregation on `Message`:
    - `$match: { userId, ...(filter === 'all' ? {} : { isReplied: filter === 'replied' }) }`.
    - `$group: { _id: "$threadId", c: { $sum: 1 } }`.
    - map `_id` to `threadId` → `count` per returned thread.
  - if a thread has zero messages for the current filter, return `count: 0`.

#### 3) mark message replied/unreplied (new):

- `POST /api/messages/[id]/mark-replied`
  - auth: owner only (session user must match message.userId).
  - effect: set `isReplied: true` on the message.
  - return `{ success: true }`.

- `POST /api/messages/[id]/mark-unreplied`
  - auth: owner only.
  - effect: set `isReplied: false` on the message.
  - return `{ success: true }`.

reply-trigger integration:
- if/when a message reply endpoint exists (e.g., posting a reply text or similar), after a successful reply write, call the same underlying logic as `mark-replied` to set `isReplied: true` on the target message.

#### 4) mark thread replied/unreplied (new):

- `POST /api/threads/[id]/mark-replied`
  - auth: owner only (session user must match thread.userId).
  - effect: set `isReplied: true` on the thread.
  - return `{ success: true }`.

- `POST /api/threads/[id]/mark-unreplied`
  - auth: owner only.
  - effect: set `isReplied: false` on the thread.
  - return `{ success: true }`.

notes:
- marking a thread replied does not automatically mark its messages replied. message flags are independent.
- likewise, marking all messages replied does not automatically mark the thread replied.

### frontend changes

#### global quick filter control (dashboard)

- placement: top of `Dashboard` (near “Share to Story”, “Refresh”, etc), as a **segmented control** with three options: `Unreplied` (default), `Replied`, `All`.
- selection persistence:
  - store the filter value in the url query as `?f=unreplied|replied|all` to make it shareable and to preserve state on reload.
  - initial state defaults to `unreplied` if `f` is absent or invalid.

#### data fetching integration

- when the filter changes, refetch:
  - `GET /api/threads?filter=<value>` to get the thread list and filtered message counts per thread.
  - for each visible thread, call `GET /api/get-messages?threadSlug=<slug>&filter=<value>`.
- thread visibility rules:
  - under `unreplied`, hide threads with `thread.isReplied = true`.
  - under `replied`, show only threads with `thread.isReplied = true`.
  - under `all`, show all threads.
- badge counts:
  - display `count` returned by `/api/threads` (already filtered by current `filter`).

#### user actions

- message card:
  - add a manual **Mark Replied** / **Mark Unreplied** action. when triggered, call the corresponding api endpoint and optimistically update the ui: update the message’s `isReplied` locally and, if in `unreplied` view, remove it immediately from the grid.
  - after a successful “Share to Story”, automatically call `POST /api/messages/[id]/mark-replied` and optimistically update counts and visibility.

- thread header (per thread section):
  - add **Archive (Mark Replied)** / **Unarchive (Mark Unreplied)** action. call the corresponding api endpoint. if the global filter is `unreplied`, hiding the thread should occur immediately once archived.

#### empty states

- `unreplied` view: if a thread has zero unreplied messages, the thread may still be visible (if `thread.isReplied = false`), but show the standard “no messages yet” state within it. if user archives the thread, it disappears from `unreplied`.
- `replied` view: similar behavior in reverse.

### query logic summary

- messages query base: `{ userId, ...(threadId? { threadId }) }`.
- add `isReplied` constraint based on `filter`, except when `all`.
- threads query base: `{ userId }` plus `isReplied` based on `filter` (except `all`).
- counts aggregation: conditioned by the same `filter` for consistency.
- sorting remains primarily by `createdAt: -1`; keep special-casing “ama” to top.

### indexes and performance

- primary access patterns are filtered by `userId`, `threadId`, `isReplied`, and sorted by `createdAt`.
- proposed compound indexes:
  - messages: `{ userId: 1, isReplied: 1, createdAt: -1 }`, `{ threadId: 1, isReplied: 1, createdAt: -1 }`.
  - threads: `{ userId: 1, isReplied: 1, createdAt: -1 }`.
- ensure background index builds in production; index names should be explicit to avoid duplication.

### permissions and security

- all routes respect next-auth session; only the owner can read/modify their threads and messages.
- mark endpoints must verify ownership before writes.

### legacy data behavior

- legacy embedded messages under `User` are not modified by the migration.
- when `Message` collection returns zero items and the code falls back to legacy, **filtering is not applied**. this is acceptable per requirements (avoid legacy headaches). in practice, most users should be off legacy data post-migration.

### deployment checklist

- deploy code that adds schema fields and respects the new `filter` semantics across endpoints.
- run `scripts/run-add-replied-flags.ts` against production.
- verify indexes are present and used (`explain()` spot checks in staging).
- verify `/api/threads?filter=unreplied` and `/api/get-messages?threadSlug=...&filter=unreplied` return expected shapes and counts.
- confirm ui defaults to `Unreplied` and url uses `?f=unreplied`.

### future enhancements (optional)

- consider adding `repliedAt: Date` for auditability and sorting.
- introduce pagination params to `/api/get-messages` for large inboxes.
- add bulk actions (mark multiple messages replied/unreplied; archive multiple threads).
- expose per-thread quick filter override if needed later (remain global for now).