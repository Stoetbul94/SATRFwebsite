import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

/**
 * ONE-TIME ADMIN BOOTSTRAP
 *
 * - If the Auth user exists: enable account + set Firestore role admin / status active.
 * - If missing (e.g. you deleted them in Firebase Console): create Auth user +
 *   Firestore profile as active admin (POST body must include password).
 *
 * Guarded by ADMIN_BOOTSTRAP_SECRET. Delete that env var after use.
 *
 * GET (existing user only):
 *   /api/admin/bootstrap?secret=...&email=you@example.com
 *
 * POST (create or promote):
 *   { "secret", "email", "password", "firstName?", "lastName?", "club?" }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected) return res.status(404).json({ error: 'Not found' });

  const secret = (req.query.secret as string) || (req.body?.secret as string) || '';
  if (secret !== expected) return res.status(403).json({ error: 'Forbidden' });

  const email = (((req.query.email as string) || (req.body?.email as string) || '') as string)
    .toLowerCase()
    .trim();
  if (!email) return res.status(400).json({ error: 'email is required' });

  const password = req.body?.password as string | undefined;
  const firstName = (req.body?.firstName as string)?.trim() || 'SATRF';
  const lastName = (req.body?.lastName as string)?.trim() || 'Admin';
  const club = (req.body?.club as string)?.trim() || 'SATRF';

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    let userRecord;
    let created = false;

    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') throw err;

      if (req.method !== 'POST' || !password || password.length < 8) {
        return res.status(404).json({
          error: 'No Auth user for this email. Send POST with password (min 8 chars) to create an admin account.',
        });
      }

      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        disabled: false,
        emailVerified: true,
      });
      created = true;

      await adminDb.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        firstName,
        lastName,
        email,
        membershipType: 'senior',
        club,
        role: 'admin',
        roles: { admin: true },
        status: 'active',
        isActive: true,
        emailConfirmed: true,
        createdAt: now,
        updatedAt: now,
        loginCount: 0,
      });

      return res.status(201).json({
        success: true,
        created: true,
        uid: userRecord.uid,
        message: `Created ${email} as active admin. Log in at /login, then delete ADMIN_BOOTSTRAP_SECRET on Vercel.`,
      });
    }

    // Existing Auth user — enable and promote.
    await adminAuth.updateUser(userRecord.uid, { disabled: false });

    await adminDb.collection('users').doc(userRecord.uid).set(
      {
        id: userRecord.uid,
        email: userRecord.email?.toLowerCase() || email,
        role: 'admin',
        roles: { admin: true },
        status: 'active',
        isActive: true,
        updatedAt: now,
        ...(created
          ? {}
          : {
              firstName: firstName !== 'SATRF' ? firstName : undefined,
              lastName: lastName !== 'Admin' ? lastName : undefined,
            }),
      },
      { merge: true }
    );

    if (req.method === 'POST' && password && password.length >= 8) {
      await adminAuth.updateUser(userRecord.uid, { password });
    }

    return res.status(200).json({
      success: true,
      created: false,
      uid: userRecord.uid,
      message: `${email} is now an active admin. Delete ADMIN_BOOTSTRAP_SECRET on Vercel when done.`,
    });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already exists under a different state. Check Firebase Auth console.' });
    }
    console.error('bootstrap error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
