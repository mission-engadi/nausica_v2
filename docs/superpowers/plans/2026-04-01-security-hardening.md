# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate open client-side Firestore writes on the invitation form, route all submission logic through a single trusted server action protected by Cloudflare Turnstile, and harden Firebase rules + deployment config.

**Architecture:** `InvitationForm` becomes a pure UI component — no Firestore SDK, no direct writes. It calls `submitInvitationAction(formData, turnstileToken)` which (1) verifies the Turnstile token server-side, (2) validates with Zod, (3) writes to Firestore via `firebase-admin`, (4) sends email. Firestore rules set `allow create: if false` on invitations as a defence-in-depth layer. Storage rules scope public reads to `/public/**` with upload size/type guards.

**Tech Stack:** Next.js 16 (App Router, server actions), Firebase Admin SDK (`firebase-admin`), Cloudflare Turnstile (`@marsidev/react-turnstile`), Zod, Vitest (unit tests for pure functions)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `.gitignore` | Modify | Exclude `.firebase/` cache from version control |
| `package.json` | Modify | Add `firebase-admin`, `@marsidev/react-turnstile`; add vitest to devDeps + test script |
| `vitest.config.ts` | Create | Vitest config with `@/` path alias |
| `src/lib/invitation-schema.ts` | Create | Exported Zod schema + `InvitationInput` type (extracted from `actions.ts`) |
| `src/lib/turnstile.ts` | Create | Pure function: verifies Turnstile token via Cloudflare API |
| `src/lib/firebase-admin.ts` | Create | Admin SDK singleton: `adminDb` export |
| `src/lib/actions.ts` | Modify | Use new modules; add Turnstile verify + Admin Firestore write; remove Zod schema inline |
| `src/components/InvitationForm.tsx` | Modify | Remove `addDoc`/`db` imports; add `<Turnstile>` widget; pass token to action |
| `firestore.rules` | Modify | Set `allow create: if false` on invitations |
| `storage.rules` | Modify | Scope reads to `/public/**`; add size + content-type guards on writes |
| `firebase.json` | Modify | Tighten hosting `ignore` list |
| `src/app/admin/dashboard/page.tsx` | Modify | Prefix storage upload path with `public/` |
| `src/lib/__tests__/invitation-schema.test.ts` | Create | Unit tests for Zod schema validation |
| `src/lib/__tests__/turnstile.test.ts` | Create | Unit tests for `verifyTurnstileToken` |

---

## Prerequisites (manual, do before starting)

1. **Rotate SMTP password** in Migadu → update `EMAIL_PASS` in `.env.local`
2. **Cloudflare Turnstile**: dash.cloudflare.com → Turnstile → Add site → Invisible widget → add your domain + `localhost` → copy Site Key and Secret Key
3. **Firebase service account**: Firebase Console → Project Settings → Service Accounts → Generate new private key → download JSON → copy `project_id`, `client_email`, `private_key`
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=<from Cloudflare>
   TURNSTILE_SECRET_KEY=<from Cloudflare>
   FIREBASE_ADMIN_PROJECT_ID=<from service account JSON>
   FIREBASE_ADMIN_CLIENT_EMAIL=<from service account JSON>
   FIREBASE_ADMIN_PRIVATE_KEY="<from service account JSON — include full -----BEGIN...-----END----- value>"
   ```

---

## Task 1: Fix .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add `.firebase/` to .gitignore**

Open `.gitignore` and add at the end:

```
# Firebase local CLI cache
.firebase/
```

- [ ] **Step 2: Remove .firebase/ from git tracking (if already tracked)**

```bash
git rm -r --cached .firebase/ 2>/dev/null || echo "Not tracked, skipping"
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: exclude .firebase/ cache from version control"
```

---

## Task 2: Install dependencies and configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install production dependencies**

```bash
npm install firebase-admin @marsidev/react-turnstile
```

Expected: both packages appear in `package.json` `dependencies`.

- [ ] **Step 2: Install vitest as dev dependency**

```bash
npm install -D vitest
```

- [ ] **Step 3: Add test script to package.json**

Open `package.json` and update the `scripts` section:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "deploy": "firebase deploy",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Create vitest.config.ts**

Create `/Users/engadi/GitHub/nausica_v2-main/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Step 5: Verify vitest runs (no tests yet)**

```bash
npm test
```

Expected output:
```
No test files found, exiting with code 1
```
(This is expected — we haven't written tests yet.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add firebase-admin, turnstile, vitest"
```

---

## Task 3: Extract Zod schema to invitation-schema.ts (TDD)

**Files:**
- Create: `src/lib/invitation-schema.ts`
- Create: `src/lib/__tests__/invitation-schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/invitation-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { InvitationSchema } from "../invitation-schema";

const valid = {
  name: "Mario Rossi",
  email: "mario@esempio.it",
  church: "Chiesa Esempio",
  startDate: "2026-05-01",
  endDate: "2026-05-03",
  location: "Roma",
};

describe("InvitationSchema", () => {
  it("accepts a valid invitation payload", () => {
    expect(() => InvitationSchema.parse(valid)).not.toThrow();
  });

  it("rejects name shorter than 2 chars", () => {
    expect(() => InvitationSchema.parse({ ...valid, name: "A" })).toThrow();
  });

  it("rejects name longer than 100 chars", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, name: "A".repeat(101) })
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, email: "not-an-email" })
    ).toThrow();
  });

  it("rejects email longer than 254 chars", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, email: "a".repeat(245) + "@b.it" })
    ).toThrow();
  });

  it("rejects church shorter than 2 chars", () => {
    expect(() => InvitationSchema.parse({ ...valid, church: "X" })).toThrow();
  });

  it("rejects church longer than 200 chars", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, church: "A".repeat(201) })
    ).toThrow();
  });

  it("rejects startDate not in YYYY-MM-DD format", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, startDate: "01/05/2026" })
    ).toThrow();
  });

  it("rejects endDate not in YYYY-MM-DD format", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, endDate: "2026/05/03" })
    ).toThrow();
  });

  it("rejects location shorter than 2 chars", () => {
    expect(() => InvitationSchema.parse({ ...valid, location: "X" })).toThrow();
  });

  it("rejects location longer than 200 chars", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, location: "A".repeat(201) })
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: tests fail with `Cannot find module '../invitation-schema'`

- [ ] **Step 3: Create src/lib/invitation-schema.ts**

```ts
import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const InvitationSchema = z.object({
  name: z
    .string()
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(100, "Nome troppo lungo (max 100 caratteri)"),
  email: z
    .string()
    .email("Email non valida")
    .max(254, "Email troppo lunga"),
  church: z
    .string()
    .min(2, "Inserisci il nome della chiesa o organizzazione")
    .max(200, "Nome troppo lungo (max 200 caratteri)"),
  startDate: z
    .string()
    .regex(DATE_REGEX, "Data di inizio non valida (usa formato YYYY-MM-DD)"),
  endDate: z
    .string()
    .regex(DATE_REGEX, "Data di fine non valida (usa formato YYYY-MM-DD)"),
  location: z
    .string()
    .min(2, "Inserisci il luogo o città")
    .max(200, "Luogo troppo lungo (max 200 caratteri)"),
});

export type InvitationInput = z.infer<typeof InvitationSchema>;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected:
```
✓ src/lib/__tests__/invitation-schema.test.ts (11 tests)
Test Files  1 passed (1)
Tests       11 passed (11)
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/invitation-schema.ts src/lib/__tests__/invitation-schema.test.ts
git commit -m "feat: extract InvitationSchema to standalone module with tests"
```

---

## Task 4: Create Turnstile verifier (TDD)

**Files:**
- Create: `src/lib/turnstile.ts`
- Create: `src/lib/__tests__/turnstile.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/turnstile.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "../turnstile";

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.TURNSTILE_SECRET_KEY = "test-secret-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it("returns true when Cloudflare responds with success: true", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true }),
    } as Response);

    const result = await verifyTurnstileToken("valid-token");

    expect(result).toBe(true);
  });

  it("returns false when Cloudflare responds with success: false", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
    } as Response);

    const result = await verifyTurnstileToken("bad-token");

    expect(result).toBe(false);
  });

  it("calls the Cloudflare siteverify endpoint with the correct body", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true }),
    } as Response);

    await verifyTurnstileToken("my-token");

    expect(fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "test-secret-key",
          response: "my-token",
        }),
      }
    );
  });

  it("returns false if fetch throws (network error)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const result = await verifyTurnstileToken("some-token");

    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: tests fail with `Cannot find module '../turnstile'`

- [ ] **Step 3: Create src/lib/turnstile.ts**

```ts
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run all tests to confirm they pass**

```bash
npm test
```

Expected:
```
✓ src/lib/__tests__/invitation-schema.test.ts (11 tests)
✓ src/lib/__tests__/turnstile.test.ts (4 tests)
Test Files  2 passed (2)
Tests       15 passed (15)
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/turnstile.ts src/lib/__tests__/turnstile.test.ts
git commit -m "feat: add Turnstile token verifier with unit tests"
```

---

## Task 5: Create Firebase Admin SDK singleton

**Files:**
- Create: `src/lib/firebase-admin.ts`

- [ ] **Step 1: Create src/lib/firebase-admin.ts**

```ts
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (the three env vars being `string | undefined` is acceptable here since TypeScript treats them as possibly undefined — `cert()` will throw at runtime if they're missing, which is the correct behavior in a misconfigured deploy).

- [ ] **Step 3: Commit**

```bash
git add src/lib/firebase-admin.ts
git commit -m "feat: add Firebase Admin SDK singleton"
```

---

## Task 6: Update actions.ts

**Files:**
- Modify: `src/lib/actions.ts`

- [ ] **Step 1: Replace the full contents of src/lib/actions.ts**

```ts
"use server";

import { sendInvitationEmail } from "./email";
import { InvitationSchema, type InvitationInput } from "./invitation-schema";
import { verifyTurnstileToken } from "./turnstile";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { ZodError } from "zod";

export async function submitInvitationAction(
  formData: InvitationInput,
  turnstileToken: string
): Promise<{ success: boolean; error?: string; emailFailed?: boolean }> {
  // 1. Verify Turnstile token (blocks bots before any DB or email work)
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return { success: false, error: "Verifica anti-bot fallita. Riprova." };
  }

  // 2. Validate fields
  let validatedData: InvitationInput;
  try {
    validatedData = InvitationSchema.parse(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: "Dati non validi: " + error.errors.map((e) => e.message).join(", "),
      };
    }
    return { success: false, error: "Errore di sistema, riprova più tardi" };
  }

  // 3. Write to Firestore via Admin SDK (bypasses client security rules)
  await adminDb.collection("invitations").add({
    ...validatedData,
    timestamp: FieldValue.serverTimestamp(),
  });

  // 4. Send notification email (failure is non-fatal — record is already saved)
  const emailResult = await sendInvitationEmail(validatedData);
  if (!emailResult.success) {
    console.error("Email delivery failed:", emailResult.error);
    return { success: true, emailFailed: true };
  }

  return { success: true };
}
```

- [ ] **Step 2: Run tests to confirm nothing is broken**

```bash
npm test
```

Expected: all 15 tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions.ts
git commit -m "feat: route invitation writes through server action via firebase-admin + Turnstile"
```

---

## Task 7: Update InvitationForm.tsx

**Files:**
- Modify: `src/components/InvitationForm.tsx`

- [ ] **Step 1: Replace the full contents of src/components/InvitationForm.tsx**

```tsx
"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { submitInvitationAction } from "@/lib/actions";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Turnstile } from "@marsidev/react-turnstile";

export default function InvitationForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        church: "",
        startDate: "",
        endDate: "",
        location: ""
    });

    const today = new Date().toISOString().split("T")[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!turnstileToken) {
            toast.error("Verifica in corso", {
                description: "Attendi il completamento della verifica anti-bot."
            });
            return;
        }

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end < start) {
            toast.error("Errore date", {
                description: "La data di fine non può essere precedente alla data di inizio."
            });
            return;
        }

        const oneMonthLater = new Date(start);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        if (end > oneMonthLater) {
            toast.error("Periodo troppo lungo", {
                description: "Il periodo dell'evento non può superare un mese di durata."
            });
            return;
        }

        setLoading(true);
        try {
            const result = await submitInvitationAction(formData, turnstileToken);

            if (result.success) {
                if (result.emailFailed) {
                    toast.warning("Invito salvato", {
                        description: "Richiesta registrata, ma l'invio email è fallito. Ci metteremo in contatto presto."
                    });
                } else {
                    toast.success("Richiesta inviata con successo!");
                }
                setSuccess(true);
                setFormData({ name: "", email: "", church: "", startDate: "", endDate: "", location: "" });
                setTurnstileToken(null);
            } else {
                toast.error("Errore di invio", {
                    description: result.error ?? "Si è verificato un errore. Controlla la tua connessione e riprova."
                });
            }
        } catch (error) {
            console.error("Error submitting invitation:", error);
            toast.error("Errore di invio", {
                description: "Si è verificato un errore. Controlla la tua connessione e riprova."
            });
        }
        setLoading(false);
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-navy rounded-[32px] lg:rounded-[40px] p-8 lg:p-12 text-center space-y-5 lg:space-y-6 text-white max-w-lg mx-auto shadow-2xl"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                >
                    <CheckCircle2 className="w-12 lg:w-16 h-12 lg:h-16 text-secondary mx-auto" />
                </motion.div>
                <h3 className="text-2xl lg:text-3xl font-black italic">Richiesta Inviata!</h3>
                <p className="opacity-70 text-sm lg:text-base">
                    Grazie per averci contattato. Prenderemo in visione la tua richiesta e ti risponderemo il prima possibile.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-secondary font-bold hover:underline text-sm lg:text-base"
                >
                    Invia un&apos;altra richiesta
                </button>
            </motion.div>
        );
    }

    return (
        <section className="py-16 lg:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6 lg:space-y-8 order-2 lg:order-1"
                >
                    <div className="space-y-3 lg:space-y-4">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy uppercase tracking-tighter leading-none">
                            Invita <span className="text-secondary">Nausica</span>
                        </h2>
                        <p className="text-base lg:text-lg text-slate-500 max-w-md">
                            Se desideri invitare Nausica per un evento, una conferenza o un incontro, compila il modulo sottostante con tutti i dettagli necessari.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:gap-6">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-4 lg:p-6 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-100 italic"
                        >
                            <span className="text-secondary font-black block text-lg lg:text-2xl mb-0.5 lg:mb-1">Passione</span>
                            <span className="text-[10px] lg:text-xs text-navy/40 font-bold uppercase tracking-widest">Per le anime</span>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-4 lg:p-6 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-100 italic"
                        >
                            <span className="text-secondary font-black block text-lg lg:text-2xl mb-0.5 lg:mb-1">Verità</span>
                            <span className="text-[10px] lg:text-xs text-navy/40 font-bold uppercase tracking-widest">Senza compromessi</span>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    onSubmit={handleSubmit}
                    className="bg-navy rounded-[32px] lg:rounded-[40px] p-6 lg:p-8 xl:p-12 shadow-2xl space-y-5 lg:space-y-6 order-1 lg:order-2"
                >
                    <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                        <div className="space-y-2">
                            <label htmlFor="inv-name" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Nome Completo</label>
                            <input
                                required
                                id="inv-name"
                                type="text"
                                placeholder="Il tuo nome"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors text-sm lg:text-base"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="inv-email" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Email</label>
                            <input
                                required
                                id="inv-email"
                                type="email"
                                placeholder="email@esempio.it"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors text-sm lg:text-base"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="inv-church" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Chiesa / Organizzazione</label>
                        <input
                            required
                            id="inv-church"
                            type="text"
                            placeholder="Nome chiesa o organizzazione"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors text-sm lg:text-base"
                            value={formData.church}
                            onChange={(e) => setFormData({ ...formData, church: e.target.value })}
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                        <div className="space-y-2">
                            <label htmlFor="inv-start" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Da (Inizio)</label>
                            <input
                                required
                                id="inv-start"
                                type="date"
                                min={today}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors [color-scheme:dark] text-sm lg:text-base"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="inv-end" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">A (Fine)</label>
                            <input
                                required
                                id="inv-end"
                                type="date"
                                min={formData.startDate || today}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors [color-scheme:dark] text-sm lg:text-base"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="inv-location" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Luogo / Città</label>
                        <input
                            required
                            id="inv-location"
                            type="text"
                            placeholder="Indirizzo o città dell'evento"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-colors text-sm lg:text-base"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>

                    <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                        onSuccess={setTurnstileToken}
                        onError={() => setTurnstileToken(null)}
                        onExpire={() => setTurnstileToken(null)}
                        options={{ theme: "dark" }}
                    />

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading || turnstileToken === null}
                        className="w-full bg-secondary text-navy font-black py-3 lg:py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-3 lg:mt-4"
                    >
                        {loading ? "Invio in corso..." : "Invia Invito"}
                        <Send className="w-4 lg:w-5 h-4 lg:h-5" />
                    </motion.button>
                </motion.form>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all 15 tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/InvitationForm.tsx
git commit -m "feat: remove direct Firestore write from InvitationForm, add Turnstile widget"
```

---

## Task 8: Update firestore.rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Replace the full contents of firestore.rules**

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
      // firebase-admin bypasses these rules — 'if false' is a defence-in-depth layer.
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

- [ ] **Step 2: Verify rules syntax with Firebase CLI**

```bash
npx firebase-tools firestore:rules --project $(grep -o '"projectId": "[^"]*"' .firebase/*.cache 2>/dev/null | head -1 | cut -d'"' -f4 || echo "your-project-id")
```

If that doesn't resolve the project ID, run:
```bash
npx firebase-tools deploy --only firestore:rules --dry-run
```

Expected: `Rules file validated successfully.`

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "security: deny direct client writes to invitations collection"
```

---

## Task 9: Update storage.rules

**Files:**
- Modify: `storage.rules`

- [ ] **Step 1: Replace the full contents of storage.rules**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAdmin() {
      return firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));
    }

    // Public event images — readable by anyone, writable only by admins with constraints
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && isAdmin()
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // All other paths: implicit deny
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add storage.rules
git commit -m "security: scope storage reads to /public/**, add upload size+type guards"
```

---

## Task 10: Update firebase.json hosting ignore

**Files:**
- Modify: `firebase.json`

- [ ] **Step 1: Replace the full contents of firebase.json**

```json
{
  "firestore": {
    "database": "(default)",
    "location": "nam5",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "auth": {
    "providers": {
      "emailPassword": true
    }
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "source": ".",
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
      "next.config.ts",
      "vitest.config.ts"
    ],
    "cleanUrls": true,
    "trailingSlash": false
  },
  "experimental": {
    "webFrameworks": true
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add firebase.json
git commit -m "security: tighten hosting ignore to exclude source and config files"
```

---

## Task 11: Update dashboard storage upload path

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx` (line 204)

- [ ] **Step 1: Update the storage ref to use public/ prefix**

On line 204, change:

```ts
// Before
const storageRef = ref(storage, `event-images/${Date.now()}_${imageFile.name}`);
```

To:

```ts
// After
const storageRef = ref(storage, `public/event-images/${Date.now()}_${imageFile.name}`);
```

This ensures uploaded event images land under `/public/event-images/...`, which is the path matched by the new storage rules `allow read: if true` rule.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "fix: prefix storage upload path with public/ to match new storage rules"
```

---

## Task 12: Deploy rules and smoke-test

- [ ] **Step 1: Deploy Firestore and Storage rules**

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

Expected:
```
✔  firestore: released rules firestore.rules
✔  storage: released rules storage.rules
Deploy complete!
```

- [ ] **Step 2: Smoke-test — confirm direct client write is rejected**

Open browser DevTools console on your local dev server or production site and run:

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
// (use your actual firebaseConfig values)
const app = initializeApp({ apiKey: "...", projectId: "..." });
const db = getFirestore(app);
addDoc(collection(db, "invitations"), { test: true })
  .then(() => console.log("ERROR: write should have been denied"))
  .catch(e => console.log("CORRECT: write denied —", e.code));
```

Expected: `CORRECT: write denied — permission-denied`

- [ ] **Step 3: Smoke-test — submit the invitation form end-to-end**

1. Start dev server: `npm run dev`
2. Navigate to the invitation form section
3. Fill all fields with valid data
4. Wait ~1 second for Turnstile to resolve (button becomes enabled)
5. Click "Invia Invito"
6. Expected: success toast; check Firebase Console → Firestore → `invitations` collection for the new document; check your admin email inbox for the notification

- [ ] **Step 4: Smoke-test — confirm existing event images still load**

If you have existing event images stored at `event-images/...` (without the `public/` prefix), they are now under a path not covered by `allow read: if true`. Two options:

- **Move existing files**: Use Firebase Console → Storage → rename/move files from `event-images/` to `public/event-images/`
- **Or**: Update `imageUrl` fields in existing Firestore event documents to point to the new URLs after moving

Check that event images on the public landing page still render after this step.

- [ ] **Step 5: Run full test suite one last time**

```bash
npm test
```

Expected:
```
✓ src/lib/__tests__/invitation-schema.test.ts (11 tests)
✓ src/lib/__tests__/turnstile.test.ts (4 tests)
Test Files  2 passed (2)
Tests       15 passed (15)
```

- [ ] **Step 6: Run npm audit**

```bash
npm audit
```

Expected: no `high` or `critical` vulnerabilities. If any appear, run:

```bash
npm audit fix
```

Then re-run `npm audit` to confirm. If `npm audit fix` cannot resolve them automatically (e.g., requires a major version bump), evaluate each one manually — `next` and `nodemailer` are the most likely candidates per the remediation plan.

- [ ] **Step 7: Full deploy**

```bash
npx firebase-tools deploy
```

Expected: all services deploy cleanly.
