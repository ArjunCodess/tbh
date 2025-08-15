## profile customisations — technical design

### scope

- profile color: background color for the public profile header
- text color: main text color on the profile
- username edit: must remain unique, url-safe
- display name edit: free-form, no uniqueness constraint

### data model changes (mongoose)

File: `lib/models/user.schema.ts`

Add the following fields and validation to the `User` schema:

```ts
// additions inside new mongoose.Schema({ ... })
displayName: {
  type: String,
  trim: true,
  maxlength: [50, 'display name must be <= 50 characters'],
  default: function () {
    // default to username for existing and new users when not provided
    return (this as any).username;
  },
},
profileColor: {
  type: String,
  required: true,
  default: '#111827', // slate-900-ish default header bg
  validate: {
    validator: (v: string) => /^#(?:[0-9a-fA-F]{6})$/.test(v),
    message: 'profile color must be a 6-digit hex like #RRGGBB',
  },
},
textColor: {
  type: String,
  required: true,
  default: '#FFFFFF',
  validate: {
    validator: (v: string) => /^#(?:[0-9a-fA-F]{6})$/.test(v),
    message: 'text color must be a 6-digit hex like #RRGGBB',
  },
},
```

Indexes and collation for case-insensitive username uniqueness:

```ts
// ensure collection-level collation for case-insensitive unique index
// when defining the schema
const UserSchema: Schema<User> = new mongoose.Schema({...}, { timestamps: true, collation: { locale: 'en', strength: 2 } });

// make sure there is a unique index on username that uses the schema/collection collation
UserSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
```

Notes:
- existing code already has `unique: true` on `username`, but without collation it is case-sensitive at the index level. We will recreate this index with collation to enforce case-insensitive uniqueness.

### field validation rules

- username:
  - regex: `^[a-z0-9_]+$` (lowercase, digits, underscore only)
  - length: 1–20
  - unique (case-insensitive)
  - reserved list check (e.g., `admin`, `support`, `api`, `dashboard`, `u`, `signup`, `signin`, etc.)
- displayName:
  - length: 1–50
  - allow unicode letters, numbers, spaces, common punctuation
- profileColor, textColor:
  - hex only in `#RRGGBB` format (alpha not stored)

Update Zod validation for username in `lib/schema/signUpSchema.ts` and new update schema:

```ts
export const usernameValidation = z
  .string()
  .min(1, 'username must be at least 1 character')
  .max(20, 'username must be no more than 20 characters')
  .regex(/^[a-z0-9_]+$/, 'username must be lowercase letters, numbers, underscore');

export const colorHexValidation = z
  .string()
  .regex(/^#(?:[0-9a-f]{6})$/i, 'color must be a 6-digit hex like #RRGGBB');

export const profileCustomisationsSchema = z.object({
  username: usernameValidation.optional(),
  displayName: z.string().min(1).max(50).optional(),
  profileColor: colorHexValidation.optional(),
  textColor: colorHexValidation.optional(),
});
```

### migrations

We need two migrations:
1) backfill new fields with defaults for all existing users
2) enforce case-insensitive username uniqueness only

#### 1) backfill profile colors + display name

File: `scripts/run-backfill-profile-customisations.ts`

```ts
// ts-node scripts/run-backfill-profile-customisations.ts
import 'dotenv/config';
import connectToDatabase from '@/lib/connectToDatabase';
import UserModel from '@/lib/models/user.schema';

async function main() {
  await connectToDatabase();
  const cursor = UserModel.find({}, { _id: 1, username: 1, displayName: 1, profileColor: 1, textColor: 1 }).cursor();
  let updated = 0;
  for await (const user of cursor) {
    const patch: any = {};
    if (!user.displayName) patch.displayName = user.username;
    if (!user.profileColor) patch.profileColor = '#111827';
    if (!user.textColor) patch.textColor = '#FFFFFF';
    if (Object.keys(patch).length) {
      await UserModel.updateOne({ _id: user._id }, { $set: patch });
      updated += 1;
    }
  }
  console.log(`backfill complete. updated ${updated} users.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

CLI:

```sh
pnpm ts-node scripts/run-backfill-profile-customisations.ts
```

#### 2) username normalization + unique index with collation

Goals:
- normalize to lowercase
- ensure allowed charset (replace invalid characters with `_` or remove)
- resolve collisions deterministically by appending numeric suffix `-2`, `-3`, ... (or `_2` if `-` is not allowed)
- recreate unique index with case-insensitive collation
- record redirects from old usernames to the final username

Migration script: `scripts/run-migrate-usernames.ts`

```ts
import 'dotenv/config';
import connectToDatabase from '@/lib/connectToDatabase';
import UserModel from '@/lib/models/user.schema';
import mongoose from 'mongoose';

function normalize(u: string) {
  const lower = (u || '').toLowerCase();
  const stripped = lower.replace(/[^a-z0-9_]/g, '');
  return stripped.slice(0, 20);
}

async function ensureUnique(target: string, taken: Set<string>) {
  if (!taken.has(target)) return target;
  let i = 2;
  while (true) {
    const candidate = `${target}_${i}`.slice(0, 20);
    if (!taken.has(candidate)) return candidate;
    i += 1;
  }
}

async function recreateUsernameIndex() {
  try { await UserModel.collection.dropIndex('username_1'); } catch {}
  await UserModel.collection.createIndex(
    { username: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 }, name: 'username_1' }
  );
}

### api endpoints

`app/api/profile/route.ts` (PATCH)

Behavior:
- auth required; only the authenticated user can update their own profile
- accepts any subset of: `username`, `displayName`, `profileColor`, `textColor`
- validates with Zod; colors coerced to hex `#RRGGBB`; ignores alpha
- when `username` changes:
  - normalize candidate (lowercase, allowed chars)
  - check reserved list
  - ensure availability using case-insensitive check and the unique index with collation
  - write `username_redirects` document from old → new; upsert to keep only the latest mapping

Example handler:

```ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import connectToDatabase from '@/lib/connectToDatabase';
import UserModel from '@/lib/models/user.schema';
import UsernameRedirect from '@/lib/models/usernameRedirect.schema';
import { profileCustomisationsSchema } from '@/lib/schema/profileCustomisations';

export async function PATCH(req: Request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions as any);
  if (!session?.user?._id) return Response.json({ success: false, message: 'not authenticated' }, { status: 401 });
  const userId = (session.user as any)._id;

  const body = await req.json();
  const parsed = profileCustomisationsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ success: false, message: 'invalid payload' }, { status: 400 });

  const update: any = {};
  if (parsed.data.displayName !== undefined) update.displayName = parsed.data.displayName.trim();
  if (parsed.data.profileColor !== undefined) update.profileColor = parsed.data.profileColor;
  if (parsed.data.textColor !== undefined) update.textColor = parsed.data.textColor;

  if (parsed.data.username !== undefined) {
    const next = parsed.data.username;
    const current = await UserModel.findById(userId, { username: 1 }).lean();
    if (!current) return Response.json({ success: false, message: 'user not found' }, { status: 404 });
    if (next !== current.username) {
      const taken = await UserModel.findOne({ username: next }).collation({ locale: 'en', strength: 2 }).lean();
      if (taken) return Response.json({ success: false, message: 'username is already taken' }, { status: 409 });
      update.username = next;
      await UsernameRedirect.updateOne(
        { oldUsername: String(current.username).toLowerCase() },
        { $set: { newUsername: String(next).toLowerCase(), userId } },
        { upsert: true }
      );
    }
  }

  const saved = await UserModel.findByIdAndUpdate(userId, { $set: update }, { new: true });
  return Response.json({ success: true, user: saved });
}
```

### routing updates (public profile)

File: `app/(root)/u/[username]/page.tsx`

Change the user lookup logic:
1) attempt to find by `username` (case-insensitive)
2) if not found, check `username_redirects` by `oldUsername` and issue a redirect to the `newUsername`

Example:

```ts
import UsernameRedirect from '@/lib/models/usernameRedirect.schema';
import { redirect } from 'next/navigation';

const user = await findUserByUsernameCI(username);
if (!user) {
  const mapping = await UsernameRedirect.findOne({ oldUsername: username.toLowerCase() }).collation({ locale: 'en', strength: 2 }).lean();
  if (mapping?.newUsername) redirect(`/u/${mapping.newUsername}`); // 308 by default for next/navigation
}
```

### frontend changes

Location: `app/(root)/dashboard/profile/page.tsx` (new)

UI elements:
- color pickers for `profileColor` and `textColor`
- inputs for `username` and `displayName`
- live username availability feedback (debounced) via `GET /api/check-username-unique?username=...`
- submit button to `PATCH /api/profile`

Color picker component usage based on shadcn color picker:

Source: [`shadcn color picker docs`](https://www.shadcn.io/components/forms/color-picker)

```tsx
'use client';
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from '@/components/ui/shadcn-io/color-picker';

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="max-w-sm rounded-md border bg-background p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <ColorPicker
        className="flex flex-col gap-3"
        value={value}
        onChange={(rgba) => {
          // convert to hex and drop alpha
          // rgba = [r,g,b,a]
          const [r, g, b] = rgba;
          const hex = `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
          onChange(hex);
        }}
      >
        <ColorPickerSelection />
        <div className="flex items-center gap-4">
          <ColorPickerEyeDropper />
          <div className="grid w-full gap-1">
            <ColorPickerHue />
            <ColorPickerAlpha />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ColorPickerOutput />
          <ColorPickerFormat />
        </div>
      </ColorPicker>
    </div>
  );
}
```

Wireframe description:
- section: “profile appearance”
  - colorField(profileColor)
  - colorField(textColor)
- section: “profile info”
  - input `displayName`
  - input `username` with right-aligned availability status text/icon
  - helper text explaining allowed characters and that changing username creates redirects from your previous username
- footer: save button (disabled unless dirty), revert button

Real-time username availability:
- debounce 300ms on change; when non-empty and valid regex, call `GET /api/check-username-unique?username=...`
- if equals current username (case-insensitive), show “unchanged” state and treat as available
- surface 409 conflicts from the save endpoint inline

### error handling

- invalid color: client-side regex guard; server returns 400 with message
- duplicate username: server returns 409; show inline error and keep prior value
- reserved username: server returns 400 with specific message
- rate-limiting: add soft rate limit on username changes (e.g., 3 changes/day) — optional enhancement

### security considerations

- prevent impersonation:
  - reserved usernames (system and brand names)
  - audit trail: store `username_redirects` updates with `userId` and `updatedAt`
  - notify user via email on username change (future enhancement)
  - cooldown window between username changes (future enhancement)
- authorization: only the authenticated user can update their own profile (checked via session `_id`)
- canonicalization: enforce lowercase username in storage to avoid lookalike/case confusion

### deliverables checklist

- mongoose schema update code for `displayName`, `profileColor`, `textColor` with validators
- migration scripts:
  - `run-backfill-profile-customisations.ts` to add defaults
  - `run-migrate-usernames.ts` to normalize usernames, resolve conflicts, create redirects, and recreate the unique index with collation
- api: `PATCH /api/profile` guarded by auth; validates payload; updates fields; maintains username redirect mapping
- frontend: dashboard profile page with two color pickers and two inputs; real-time availability check; integrates color picker from shadcn
- routing: public profile page checks `username_redirects` and issues a redirect when needed

### references

- shadcn color picker component: [`https://www.shadcn.io/components/forms/color-picker`](https://www.shadcn.io/components/forms/color-picker)