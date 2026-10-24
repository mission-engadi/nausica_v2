import { createRequire } from "module";
import type * as AdminAppModule from "firebase-admin/app";
import type * as AdminAuthModule from "firebase-admin/auth";
import type * as AdminFirestoreModule from "firebase-admin/firestore";

// Turbopack (Next 16) turns static firebase-admin imports into hashed aliases that resolve
// through symlinks in .next/node_modules. Firebase Hosting's function upload drops those
// symlinks, so the deployed function fails with "Failed to load external module
// firebase-admin-<hash>". Loading through Node's own resolver, with turbopackIgnore so
// Turbopack leaves the call alone, avoids the alias entirely.
// Every runtime use of firebase-admin must go through this file; type-only imports are fine.
const nodeRequire = createRequire(import.meta.url);
const { initializeApp, getApps, cert } = nodeRequire(/* turbopackIgnore: true */ "firebase-admin/app") as typeof AdminAppModule;
const { getAuth } = nodeRequire(/* turbopackIgnore: true */ "firebase-admin/auth") as typeof AdminAuthModule;
const { getFirestore, FieldValue } = nodeRequire(/* turbopackIgnore: true */ "firebase-admin/firestore") as typeof AdminFirestoreModule;

export { FieldValue };

function getAdminApp(): AdminAppModule.App {
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
export const adminAuth = getAuth(getAdminApp());

// Verifies a Firebase ID token and confirms the user is listed in /admins.
export async function isAdminToken(idToken: string): Promise<boolean> {
  try {
    const { uid } = await adminAuth.verifyIdToken(idToken);
    const adminSnap = await adminDb.collection("admins").doc(uid).get();
    return adminSnap.exists;
  } catch {
    return false;
  }
}
