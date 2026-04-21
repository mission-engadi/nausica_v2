# Security Hardening — Design Spec
**Date:** 2026-04-01
**Scope:** Priorities 0–1 of the Security, Firebase, and Mobile UX Remediation Plan
**Status:** Approved

---

## Goals

- Eliminate open client-side Firestore writes on the invitation form
- Consolidate submission into a single trusted server-side path
- Add Cloudflare Turnstile invisible CAPTCHA as anti-bot protection
- Harden Firestore and Storage rules to deny-by-default
- Fix `.gitignore` and `firebase.json` hosting to prevent accidental secret/source exposure
- Bootstrap `firebase-admin` for server-side Firestore writes

---

## Critical Findings (pre-existing, fixed in this spec)

| Finding | Risk | Fix |
|---|---|---|
| `InvitationForm` calls `addDoc` directly to Firestore from the client | High — open write, no auth, no validation, no rate limit | Remove client write; consolidate into server action |
| `firestore.rules` has `allow create: if true` on invitations | High — arbitrary fields/data can be written by anyone | Change to `allow create: if false` |
| `.firebase/` directory not in `.gitignore` | Medium — exposes Firebase project ID in hosting cache paths | Add `.firebase/` to `.gitignore` |
| `firebase.json` hosting `source: "."` with minimal ignore list | Medium — source files, rules, and config could be deployed to hosting | Tighten `ignore` list |
| Storage rules allow read on all paths unconditionally | Low-Medium — all uploaded files world-readable | Scope reads to `/public/**`; add upload constraints |

---

## Architecture

### Invitation Submission — Before

```
Client
  ├── addDoc(collection(db, "invitations"), formData)   ← open client write
  └── submitInvitationAction(formData)                  ← Zod validate + send email only
```

### Invitation Submission — After

```
Client
  └── submitInvitationAction(formData, turnstileToken)
            │
            ├── 1. Verify Turnstile token (POST to Cloudflare API, server-only)
            ├── 2. Validate all fields with Zod (existing schema + length caps)
            ├── 3. Write to Firestore via firebase-admin (bypasses client rules)
            └── 4. Send email via nodemailer
```

The client holds no Firestore SDK imports for the invitation path. No `addDoc`, no `collection`, no `db` reference in `InvitationForm.tsx`.

---

## New Dependencies

| Package | Purpose | Install |
|---|---|---|
| `firebase-admin` | Server-side Firestore writes, bypasses security rules | `npm install firebase-admin` |
| `@marsidev/react-turnstile` | Cloudflare Turnstile React widget | `npm install @marsidev/react-turnstile` |

---

## New Environment Variables

All added to `.env.local` (never committed — `.env*` is already in `.gitignore`).

| Variable | Visibility | Source |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public (client + server) | Cloudflare Turnstile dashboard → Sites |
| `TURNSTILE_SECRET_KEY` | Server-only | Cloudflare Turnstile dashboard → Sites |
| `FIREBASE_ADMIN_PROJECT_ID` | Server-only | Firebase Console → Project Settings → Service Accounts |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server-only | Firebase service account JSON |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server-only | Firebase service account JSON (include `\n` escaping) |

> **Note on SMTP credential:** The plan flags a potentially leaked SMTP password. Rotate it in Migadu webmail and update `SMTP_PASSWORD` (or equivalent) in `.env.local` before deploying. This spec cannot automate rotation.

---

## File Changes

### 1. `.gitignore`

Add:
```
# Firebase local cache
.firebase/
```

### 2. `src/lib/firebase-admin.ts` — New file

Initializes the Admin SDK exactly once (singleton pattern for Next.js server environment).

```ts
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = getFirestore(getAdminApp());
```

### 3. `src/lib/actions.ts` — Updated

Three additions to `submitInvitationAction`:

1. Accept `turnstileToken: string` as a second parameter
2. Verify the token with Cloudflare's siteverify endpoint before any other logic
3. Write the validated data to Firestore via `adminDb` after email succeeds (or regardless of email outcome, matching current intent)

Zod schema additions — cap field lengths to prevent oversized payloads:
- `name`: max 100 chars
- `email`: max 254 chars (RFC limit)
- `church`: max 200 chars
- `location`: max 200 chars
- `startDate` / `endDate`: validate `YYYY-MM-DD` format with a regex, not just min-length

Server action signature change:
```ts
// Before
export async function submitInvitationAction(formData: any)

// After
export async function submitInvitationAction(
  formData: InvitationInput,
  turnstileToken: string
): Promise<{ success: boolean; error?: string }>
```

Replace the `any` parameter with the inferred Zod type (`z.infer<typeof InvitationSchema>`).

### 4. `src/components/InvitationForm.tsx` — Updated

**Remove:**
- `import { db } from "@/lib/firebase"`
- `import { collection, addDoc, serverTimestamp } from "firebase/firestore"`
- The `addDoc(collection(db, "invitations"), {...})` call

**Add:**
- `import { Turnstile } from "@marsidev/react-turnstile"`
- `const [turnstileToken, setTurnstileToken] = useState<string | null>(null)`
- `<Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} onSuccess={setTurnstileToken} />` inside the form
- Pass `turnstileToken` as second argument to `submitInvitationAction`
- Disable the submit button if `turnstileToken` is null (widget hasn't resolved yet)

### 5. `firestore.rules` — Updated

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /events/{event} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }

    match /invitations/{invitation} {
      // All writes go through the server action via firebase-admin.
      // firebase-admin bypasses these rules, so 'if false' is purely defensive.
      allow create: if false;
      allow read, update, delete: if request.auth != null && isAdmin();
    }

    match /admins/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

### 6. `storage.rules` — Updated

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAdmin() {
      return firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));
    }

    // Public assets (event images served to visitors)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin()
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Everything else: implicit deny
  }
}
```

### 8. `src/app/admin/dashboard/page.tsx` — Storage path prefix

The dashboard uploads images using a path like `ref(storage, filename)`. Update all `ref(storage, ...)` upload calls to prefix paths with `public/`:

```ts
// Before
const storageRef = ref(storage, `events/${filename}`);

// After
const storageRef = ref(storage, `public/events/${filename}`);
```

This is required for the new Storage rules to allow the uploaded image to be publicly readable via the `/public/**` match.

### 7. `firebase.json` — Updated hosting `ignore`

```json
"ignore": [
  "firebase.json",
  "**/.*",
  "**/node_modules/**",
  "src/**",
  "docs/**",
  "*.rules",
  "*.ts",
  "*.tsx",
  ".env*",
  ".firebase/**",
  "cors.json",
  "package*.json",
  "tsconfig.json",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "next.config.ts"
]
```

> The built output served by Firebase Hosting (when using `webFrameworks: true`) comes from the Next.js build, not raw source files. The ignore list is a safety net.

---

## Turnstile Setup (manual, one-time)

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile
2. Create a new site → choose **Invisible** widget type
3. Add your domain(s) (include `localhost` for dev testing)
4. Copy **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
5. Copy **Secret Key** → `TURNSTILE_SECRET_KEY`

---

## Firestore Admin SDK Setup (manual, one-time)

1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key** → download JSON
3. Copy `project_id`, `client_email`, `private_key` into `.env.local`
4. For `FIREBASE_ADMIN_PRIVATE_KEY`: paste the full value including `-----BEGIN...-----END-----` — the `replace(/\\n/g, "\n")` in the code handles the escaped newlines from `.env` files

---

## Data Flow After Change

```
User fills form
      │
      ▼
Turnstile widget resolves (invisible, ~1s)
      │ sets turnstileToken in state
      ▼
User clicks "Invia Invito"
      │
      ▼
submitInvitationAction(formData, turnstileToken)   [server action — Node.js]
      │
      ├─ POST https://challenges.cloudflare.com/turnstile/v0/siteverify
      │     { secret: TURNSTILE_SECRET_KEY, response: turnstileToken }
      │     → { success: true/false }
      │     → if false: return { success: false, error: "Bot check failed" }
      │
      ├─ InvitationSchema.parse(formData)
      │     → if invalid: return { success: false, error: "..." }
      │
      ├─ adminDb.collection("invitations").add({ ...validatedData, timestamp: FieldValue.serverTimestamp() })
      │     → writes with Admin SDK (bypasses security rules)
      │
      └─ sendInvitationEmail(validatedData)
            → if email fails: log error, but return success (invitation already saved)
```

---

## Out of Scope (this spec)

- Firebase App Check (not needed — Turnstile covers the public form; App Check requires SDK changes across the app)
- Admin dashboard hardening (covered in P2–P4 spec)
- Mobile responsiveness and accessibility fixes (covered in P2–P4 spec)
- SMTP credential rotation (manual action required by operator)

---

## Verification Checklist

- [ ] `npm audit` shows no high/critical after upgrading
- [ ] Invitation form submits successfully end-to-end (Turnstile resolves → Firestore document created → email sent)
- [ ] Direct `addDoc` to `/invitations` from browser console is rejected by Firestore rules
- [ ] Storage write without auth is rejected
- [ ] Storage write to a path outside `/public/` by an admin is rejected
- [ ] `.firebase/` is not tracked by git after `.gitignore` change
- [ ] No source `.ts`/`.tsx` files appear in a `firebase deploy --only hosting` dry-run
