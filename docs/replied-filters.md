## Overview & Goals

Provide owners a single binary state per message and per thread — replied or not replied — that drives visibility and workflow. When the owner replies via the “share to story” flow or uses an explicit reply action, the item auto-marks as replied and is removed from the default inbox view. Only the owner (logged-in profile owner) can see, mark, and reply.

## Data model & migration

- **message schema addition**: add `isReplied: boolean` (default `false`).
- **thread schema addition**: add `isReplied: boolean` (default `false`). thread-level `isReplied = true` if any message in the thread is replied, or if the owner explicitly marks the thread replied.
- **defaults**: existing messages/threads get `isReplied: false`.
- **migration (idempotent, conceptual)**:
  - add the fields with defaults on `Message` and `Thread`.
  - create composite indexes to optimize inbox queries: `Message { userId: 1, isReplied: 1, createdAt: -1 }` and `Thread { userId: 1, isReplied: 1, createdAt: -1 }`.
  - backfill rule: if historical UI metadata indicates a thread was visually treated as replied, set its `isReplied = true`.

## Backend behavior & APIs

- **endpoints**:
  - `POST /api/messages/:id/mark-replied`
  - `POST /api/messages/:id/mark-unreplied`
  - `POST /api/threads/:id/mark-replied`
  - `POST /api/threads/:id/mark-unreplied`
- **authorization**: for each endpoint, verify the session user owns the target message/thread (`userId` matches). deny otherwise.
- **story/share integration**: upon completing the “share to story” action, the frontend calls `POST /api/messages/:id/mark-replied` before or immediately after the share completes; the endpoint sets `isReplied = true`.
- **query changes**:
  - default inbox query (`GET /api/messages?`) excludes `isReplied = true` unless `?showReplied=true` is provided.
  - optional filter `?replied=true|false` for explicit control.
  - thread listing (`GET /api/threads?`) supports the same replied filter and defaults to hiding replied threads.
- **consistency rules**:
  - when marking a thread replied, optionally propagate to children and set all child `Message.isReplied = true` (configurable behavior; default recommended: propagate). the thread’s `isReplied` should also reflect if any child is replied.

## Frontend placement & UX

- **inbox defaults**: hide replied items by default; provide a top-level toggle “Show replied” / “Hide replied”.
- **quick actions**: per message and per thread, show a small check icon to mark replied and an undo icon to unmark.
- **auto-mark on share**: when the owner shares a message to Story, immediately mark it replied and remove it from the default view. show a transient toast: “Marked replied and shared.”
- **thread behavior**: in non-default lists (e.g., All Threads), display a replied badge on thread headings when `thread.isReplied = true`. in thread view, hide replied messages by default with a control to “Show replied messages”.
- **edge cases**: if the owner marks a thread replied and later unmarks a child message, two options:
  - keep `thread.isReplied = true` until all children are unmarked; or
  - set `thread.isReplied = false` if any child is unmarked.
  - **recommendation**: `thread.isReplied = true` if any child has `isReplied = true` (more consistent with inbox expectations).

## Security & privacy notes

- enforce owner-only actions on all mark/unmark endpoints.
- do not expose `isReplied` to non-owners in public/profile APIs.
- do not add `replied_by` or similar metadata; only store the `isReplied` boolean.

## Acceptance checklist

- migration adds `isReplied` with defaults and the `{ userId, isReplied }` indexes.
- inbox API defaults to hiding replied items with optional `?showReplied=true` and `?replied` filters.
- story/share flow marks message replied atomically with the share action.
- only the owner can mark or unmark messages/threads.