import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/auth/register
 *
 * Server-side registration. Creates a Firebase Auth user that is DISABLED,
 * plus a Firestore profile with status 'pending'. The member cannot log in
 * until an admin approves them (which enables the account + sets 'active').
 */

const VALID_MEMBERSHIP = ['junior', 'senior', 'veteran'] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { firstName, lastName, email, password, membershipType, club } = req.body ?? {};

  // Validation
  const errors: string[] = [];
  if (!firstName?.trim()) errors.push('First name is required');
  if (!lastName?.trim()) errors.push('Last name is required');
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (!club?.trim()) errors.push('Club is required');
  if (!VALID_MEMBERSHIP.includes(membershipType)) errors.push('Invalid membership type');
  if (errors.length) {
    return res.status(400).json({ success: false, error: errors.join('. '), errors });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Create the auth user, disabled until approved.
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: normalizedEmail,
        password,
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        disabled: true,
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      }
      if (err.code === 'auth/invalid-password') {
        return res.status(400).json({ success: false, error: 'Password is too weak.' });
      }
      throw err;
    }

    const now = new Date().toISOString();
    await adminDb.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      membershipType,
      club: club.trim(),
      role: 'user',
      status: 'pending',
      isActive: true,
      emailConfirmed: false,
      createdAt: now,
      updatedAt: now,
      loginCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration received. Your account is pending admin approval.',
      status: 'pending',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
