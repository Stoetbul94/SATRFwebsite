/**
 * Server-only Firebase Admin initialization.
 * Import from API routes only (never client components).
 *
 * Requires env FIREBASE_SERVICE_ACCOUNT_KEY (JSON string of the service
 * account). Falls back to application default credentials (GCP/Cloud Run).
 */
import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website';

let app: App | null = null;

export function getAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    app = initializeApp({
      credential: cert(JSON.parse(serviceAccountKey)),
      projectId: PROJECT_ID,
    });
  } else {
    // Application default credentials (e.g. GCP). Will throw on write if absent.
    app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Verify a Firebase ID token from an Authorization: Bearer header.
 * Returns the decoded uid + email, or null if missing/invalid.
 */
export async function verifyRequestUser(
  authorizationHeader?: string
): Promise<{ uid: string; email: string | null } | null> {
  const token = authorizationHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email?.toLowerCase() ?? null };
  } catch {
    return null;
  }
}
