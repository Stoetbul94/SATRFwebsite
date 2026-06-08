import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import {
  deriveAgeCategory,
  isValidProvince,
  normalizeDisciplines,
  validateDateOfBirth,
  validatePhone,
} from '@/lib/memberFields';
import {
  findExistingMemberByEmail,
  mergeMemberData,
  migrateMemberReferences,
} from '@/lib/memberLink';

/**
 * POST /api/auth/register
 *
 * Server-side registration. Creates a Firebase Auth user that is DISABLED,
 * plus a Firestore profile with status 'pending'. The member cannot log in
 * until an admin approves them (which enables the account + sets 'active').
 *
 * If the email matches an existing member record (users collection, no login),
 * links the new Auth account to that record and migrates score references.
 */

const VALID_MEMBERSHIP = ['junior', 'senior', 'veteran'] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    membershipType,
    club,
    province,
    dateOfBirth,
    phone,
    disciplines,
  } = req.body ?? {};

  const errors: string[] = [];
  if (!firstName?.trim()) errors.push('First name is required');
  if (!lastName?.trim()) errors.push('Last name is required');
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (!club?.trim()) errors.push('Club is required');
  if (!VALID_MEMBERSHIP.includes(membershipType)) errors.push('Invalid membership type');
  if (!province?.trim() || !isValidProvince(String(province).trim())) {
    errors.push('A valid province is required');
  }
  const dobError = validateDateOfBirth(dateOfBirth ?? '');
  if (dobError) errors.push(dobError);
  if (!phone?.trim() || !validatePhone(String(phone))) {
    errors.push('A valid phone number is required');
  }

  const normalizedDisciplines = normalizeDisciplines(disciplines);

  if (errors.length) {
    return res.status(400).json({ success: false, error: errors.join('. '), errors });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const signupFields = {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: normalizedEmail,
    membershipType,
    club: String(club).trim(),
    province: String(province).trim(),
    dateOfBirth: String(dateOfBirth).trim(),
    phone: String(phone).trim(),
    disciplines: normalizedDisciplines.length ? normalizedDisciplines : undefined,
  };

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const existingMember = await findExistingMemberByEmail(adminDb, normalizedEmail);

    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: normalizedEmail,
        password,
        displayName: `${signupFields.firstName} ${signupFields.lastName}`,
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
    const authUid = userRecord.uid;
    const ageCategory = deriveAgeCategory(signupFields.dateOfBirth);

    if (existingMember && existingMember.id !== authUid) {
      const merged = mergeMemberData(existingMember.data(), signupFields, authUid, now);
      merged.ageCategory = merged.ageCategory ?? ageCategory;
      merged.linkedFromMemberId = existingMember.id;
      merged.status = merged.status ?? 'pending';

      await adminDb.collection('users').doc(authUid).set(merged);
      await migrateMemberReferences(adminDb, existingMember.id, authUid);
      await adminDb.collection('users').doc(existingMember.id).delete();

      return res.status(201).json({
        success: true,
        message: 'Registration received. Your existing member record has been linked to this account.',
        status: 'pending',
        linked: true,
      });
    }

    if (existingMember && existingMember.id === authUid) {
      const merged = mergeMemberData(existingMember.data(), signupFields, authUid, now);
      merged.ageCategory = merged.ageCategory ?? ageCategory;
      merged.status = 'pending';
      merged.role = merged.role ?? 'user';
      await adminDb.collection('users').doc(authUid).set(merged, { merge: true });
    } else {
      await adminDb.collection('users').doc(authUid).set({
        id: authUid,
        authUid,
        firstName: signupFields.firstName,
        lastName: signupFields.lastName,
        email: normalizedEmail,
        membershipType,
        club: signupFields.club,
        province: signupFields.province,
        dateOfBirth: signupFields.dateOfBirth,
        phone: signupFields.phone,
        phoneNumber: signupFields.phone,
        ageCategory,
        disciplines: signupFields.disciplines ?? [],
        role: 'user',
        status: 'pending',
        isActive: true,
        emailConfirmed: false,
        createdAt: now,
        updatedAt: now,
        loginCount: 0,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration received. Your account is pending admin approval.',
      status: 'pending',
      linked: !!existingMember,
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
