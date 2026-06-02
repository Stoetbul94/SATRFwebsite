import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

/**
 * ONE-TIME ADMIN BOOTSTRAP
 *
 * Promotes an already-registered account to an active admin. This exists to
 * solve the first-admin deadlock: registration creates disabled/pending users,
 * and there is no admin yet to approve the very first one.
 *
 * Guarded by ADMIN_BOOTSTRAP_SECRET. If that env var is unset, the route is a
 * no-op (404). Set it on Vercel, hit this endpoint once, then DELETE the env
 * var so the route can never be used again.
 *
 * Usage (browser):
 *   /api/admin/bootstrap?secret=YOUR_SECRET&email=you@example.com
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  // Disabled unless a secret is configured.
  if (!expected) return res.status(404).json({ error: 'Not found' });

  const secret = (req.query.secret as string) || (req.body?.secret as string) || '';
  if (secret !== expected) return res.status(403).json({ error: 'Forbidden' });

  const email = (((req.query.email as string) || (req.body?.email as string) || '') as string)
    .toLowerCase()
    .trim();
  if (!email) return res.status(400).json({ error: 'email query param is required' });

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const userRecord = await adminAuth.getUserByEmail(email);

    // Enable the auth account and promote the profile to active admin.
    await adminAuth.updateUser(userRecord.uid, { disabled: false });

    const now = new Date().toISOString();
    await adminDb.collection('users').doc(userRecord.uid).set(
      {
        id: userRecord.uid,
        email: userRecord.email?.toLowerCase() || email,
        role: 'admin',
        roles: { admin: true, user: false },
        status: 'active',
        isActive: true,
        updatedAt: now,
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      uid: userRecord.uid,
      message: `${email} is now an active admin. IMPORTANT: delete the ADMIN_BOOTSTRAP_SECRET env var on Vercel now.`,
    });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'No account with that email. Register it first, then retry.' });
    }
    console.error('bootstrap error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
