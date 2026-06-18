import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, verifyRequestUser } from '@/lib/firebaseAdmin';
import { mapUserDoc, type UserProfileUpdate } from '@/lib/auth';
import { isContentEditorEmail } from '@/lib/contentEditor';
import {
  deriveAgeCategory,
  isValidProvince,
  normalizeDisciplines,
  validateDateOfBirth,
  validatePhone,
} from '@/lib/memberFields';

const VALID_MEMBERSHIP = ['junior', 'senior', 'veteran'] as const;

function validateProfileUpdate(body: UserProfileUpdate): string[] {
  const errors: string[] = [];

  if (body.firstName !== undefined) {
    if (!body.firstName.trim()) errors.push('First name is required');
    else if (body.firstName.trim().length < 2) errors.push('First name must be at least 2 characters');
  }
  if (body.lastName !== undefined) {
    if (!body.lastName.trim()) errors.push('Last name is required');
    else if (body.lastName.trim().length < 2) errors.push('Last name must be at least 2 characters');
  }
  if (body.club !== undefined) {
    if (!body.club.trim()) errors.push('Club is required');
    else if (body.club.trim().length < 2) errors.push('Club name must be at least 2 characters');
  }
  if (body.membershipType !== undefined && !VALID_MEMBERSHIP.includes(body.membershipType)) {
    errors.push('Invalid membership type');
  }
  if (body.province !== undefined && !isValidProvince(body.province.trim())) {
    errors.push('A valid province is required');
  }
  if (body.dateOfBirth !== undefined) {
    const dobErr = validateDateOfBirth(body.dateOfBirth);
    if (dobErr) errors.push(dobErr);
  }
  const phoneVal = body.phone ?? body.phoneNumber;
  if (phoneVal !== undefined && phoneVal.trim() && !validatePhone(phoneVal)) {
    errors.push('A valid phone number is required');
  }
  if (body.disciplines !== undefined) {
    const normalized = normalizeDisciplines(body.disciplines);
    if (body.disciplines.length > 0 && normalized.length !== body.disciplines.length) {
      errors.push('Invalid discipline selection');
    }
  }
  if (body.emergencyPhone !== undefined && body.emergencyPhone.trim() && !validatePhone(body.emergencyPhone)) {
    errors.push('Please enter a valid emergency contact phone number');
  }

  return errors;
}

/**
 * GET /api/auth/profile — signed-in user's Firestore profile (Admin SDK).
 * PUT /api/auth/profile — update own profile with server-side validation.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const verified = await verifyRequestUser(req.headers.authorization);
  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getAdminDb();
  const userRef = db.collection('users').doc(verified.uid);

  if (req.method === 'GET') {
    try {
      const doc = await userRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      let profile = mapUserDoc(verified.uid, doc.data()!);

      const allowlist =
        process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
      if (verified.email && allowlist.includes(verified.email) && profile.role !== 'admin') {
        profile = { ...profile, role: 'admin', status: 'active', isActive: true };
      }

      return res.status(200).json({
        profile,
        permissions: {
          firingLineEditor: isContentEditorEmail(verified.email),
        },
      });
    } catch (error: any) {
      console.error('profile GET error:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const doc = await userRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const body = (req.body ?? {}) as UserProfileUpdate;
      const errors = validateProfileUpdate(body);
      if (errors.length) {
        return res.status(400).json({ error: errors.join('. '), errors });
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.firstName !== undefined) updates.firstName = body.firstName.trim();
      if (body.lastName !== undefined) updates.lastName = body.lastName.trim();
      if (body.membershipType !== undefined) updates.membershipType = body.membershipType;
      if (body.club !== undefined) updates.club = body.club.trim();
      if (body.province !== undefined) updates.province = body.province.trim();
      if (body.dateOfBirth !== undefined) {
        updates.dateOfBirth = body.dateOfBirth.trim();
        updates.ageCategory = deriveAgeCategory(body.dateOfBirth.trim());
      }
      if (body.disciplines !== undefined) {
        updates.disciplines = normalizeDisciplines(body.disciplines);
      }
      if (body.profileImageUrl !== undefined) updates.profileImageUrl = body.profileImageUrl;
      if (body.address !== undefined) updates.address = body.address.trim();
      if (body.emergencyContact !== undefined) updates.emergencyContact = body.emergencyContact.trim();
      if (body.emergencyPhone !== undefined) updates.emergencyPhone = body.emergencyPhone.trim();

      const phoneVal = body.phone ?? body.phoneNumber;
      if (phoneVal !== undefined) {
        const trimmed = phoneVal.trim();
        updates.phone = trimmed;
        updates.phoneNumber = trimmed;
      }

      await userRef.update(updates);

      const updated = await userRef.get();
      const profile = mapUserDoc(verified.uid, updated.data()!);
      return res.status(200).json({ profile });
    } catch (error: any) {
      console.error('profile PUT error:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
