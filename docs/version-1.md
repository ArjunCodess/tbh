## tbh v1 — architecture and feature overview

### tech stack

- **framework**: next.js 14.2.3 (app router)
- **runtime**: node.js
- **ui**: react 18, tailwind css, radix ui
- **auth**: next-auth v4 (credentials)
- **db**: mongodb via mongoose
- **validation**: zod + react-hook-form
- **http**: axios

### data models

- **user** (`app/lib/models/user.schema.ts`)
  - `username: string` (unique)
  - `email: string` (unique)
  - `password: string` (bcrypt hashed)
  - `isAcceptingMessages: boolean` (default true)
  - `messages: Message[]`
- **message** (`app/lib/models/message.schema.ts`)
  - `content: string`
  - `createdAt: date` (default now)

### authentication

- **provider**: credentials (email or username + password)
- **session strategy**: jwt
- **token augmentation**: `_id`, `isAcceptingMessages`, `username`
- **middleware** (`middleware.ts`):
  - redirects authenticated users away from `/sign-in` and `/sign-up` to `/dashboard`
  - protects `/dashboard/**` for authenticated users only
- **client**: global `SessionProvider` via `app/context/AuthProvider.tsx`

### core pages

- **auth**
  - `app/(auth)/sign-in/page.tsx`: sign in form (credentials)
  - `app/(auth)/sign-up/page.tsx`: sign up form (username/email/password), async username availability check
- **dashboard**
  - `app/(root)/dashboard/page.tsx`: copy public profile link, toggle accept messages, reload messages, link to share qna; message list grid
  - `app/(root)/dashboard/message/[messageId]/page.tsx`: view a single message, generate sharable image, share via web share api
  - `app/(root)/dashboard/share-qna/page.tsx`: share-qna image prompt ui (current design is basic)
- **public profile**
  - `app/(root)/profile/[username]/page.tsx`: send anonymous message to a user; includes suggested message buttons

### api routes

- `app/api/auth/[...nextauth]/` (get/post): next-auth routes
- `app/api/sign-up/route.ts` (post): register user (hash password, create account)
- `app/api/check-username-unique/route.ts` (get): username availability
- `app/api/send-message/route.ts` (post): append a message to a target user if `isAcceptingMessages`
- `app/api/get-messages/route.ts` (get): current user’s messages (sorted desc by `createdAt` via aggregation)
- `app/api/get-single-message/route.ts` (get): fetch one message by id for current user
- `app/api/delete-message/[messageId]/route.ts` (delete): remove a message by id for current user
- `app/api/accept-messages/route.ts` (get/post): read/toggle `isAcceptingMessages`
- `app/api/suggest-messages/route.ts` (get): returns a random triple of pre-canned questions separated by `||`
- `app/api/reply-image-generation/route.tsx` (get): returns an image for sharing a question (consumed in message detail page)

### notable flows

- **send anonymous message**: visitor opens `/profile/[username]` → composes message or taps a suggested message → `POST /api/send-message`
- **manage inbox**: signed-in user opens `/dashboard` → toggles accept messages → views/deletes messages → opens message detail for sharing
- **share to story**: on `/dashboard/message/[messageId]` → generates an image via `/api/reply-image-generation` → shares via web share api

### limitations in v1

- share qna prompt is minimally designed and rigid
- suggestions are static (non-ai), format-coupled to `||`
- no concept of threads or organizing messages
- single-message model without multi-question/answer threads
- next.js 14 + next-auth 4; not aligned with the latest rsc-first auth patterns