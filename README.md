# Nausica della Valle — sito del ministero

Public site and admin panel for [nausicadellavalle.org](https://nausicadellavalle.org).
Next.js 16 (App Router) on Firebase Hosting, with Firestore, Firebase Auth and Storage.

## What's here

| Area | Where |
| --- | --- |
| Public pages (hero, events, messages, book, donations, invitation form) | `src/app/page.tsx`, `src/components/` |
| Admin panel (events, invitation requests, site content, PayPal settings) | `src/app/admin/` |
| Server logic (invitations, PayPal, admin PayPal config) | `src/app/api/**/route.ts` → `src/lib/invitations.ts`, `src/lib/paypal.ts`, `src/lib/paypal-config.ts` |
| Firestore / Storage rules | `firestore.rules`, `storage.rules` |

Pages are static and served from the CDN; only `/api/*` runs in the Cloud Function.

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest
npm run lint
```

Environment variables go in `.env.local` (git-ignored):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Client Firebase config (also in the committed `.env.production`) |
| `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` | Service account for `firebase-admin` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile on the invitation form |
| `TURNSTILE_HOSTNAMES` | Comma-separated hostnames accepted from Turnstile. Production: `nausicadellavalle.org` only. Local dev uses `.env.development.local` with `localhost,127.0.0.1` |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | SMTP for invitation notifications |

The PayPal client ID and secret are not env vars: an admin sets them in the panel, and the
secret is stored in `adminConfig/paypal`, which only the server can read.

## Deploy

```bash
npx firebase deploy   # use the project's firebase-tools, not an older global one
```

Things that have bitten this project before:

- **Server code must live in `/api` route handlers, not server actions.** firebase-tools detects
  server actions through a manifest field Next 16 no longer writes, and then deploys the site
  as static files with no function.
- **Load `firebase-admin` only through `src/lib/firebase-admin.ts`.** It uses `createRequire`
  with `turbopackIgnore` because Turbopack's hashed external aliases break in the deployed
  function ("Failed to load external module firebase-admin-<hash>").
- **`firebase-admin` is pinned to 13 and `firebase` to 12.** `firebase-frameworks`, which
  firebase-tools adds to the function at deploy time, rejects newer versions.
- **Every `.env.*` file is copied into the function.** Keep only what the server needs in them.

## Security notes

- Invitation requests need a valid Turnstile token for the `invitation` action from an allowed
  hostname, and each token is accepted once (`turnstileTokens`, purged by a TTL policy on
  `expiresAt`).
- Admins are the users listed in the `admins` collection; that is checked in Firestore rules
  and, for `/api/admin/*`, by verifying the caller's Firebase ID token.
