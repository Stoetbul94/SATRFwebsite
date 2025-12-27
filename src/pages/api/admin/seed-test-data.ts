import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Minimal, admin-protected seed endpoint to create test users + test events
// Usage:
//   POST   /api/admin/seed-test-data    (with Bearer token for an admin user)  -> seeds users + events
//   DELETE /api/admin/seed-test-data    (with Bearer token for an admin user)  -> deletes test users/events (isTestEvent / isTestUser)
//
// All records are tagged with:
//   isTestUser: true
//   isTestEvent: true

const TEST_USERS = [
  {
    email: 'satrf.test.admin@example.com',
    password: 'TestAdmin#123',
    firstName: 'Test',
    lastName: 'Admin',
    roles: { admin: true },
    membershipType: 'test',
    club: 'Test Club',
    isTestUser: true,
  },
  {
    email: 'satrf.test.user@example.com',
    password: 'TestUser#123',
    firstName: 'Test',
    lastName: 'User',
    roles: { admin: false },
    membershipType: 'test',
    club: 'Test Club',
    isTestUser: true,
  },
];

const TEST_EVENTS = [
  {
    title: 'Test Prone Match',
    type: 'Prone',
    location: 'Pretoria Military Range',
    description: 'Test event (prone) for E2E verification.',
    status: 'open',
    date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // next week
    maxParticipants: 60,
    currentParticipants: 0,
    isTestEvent: true,
  },
  {
    title: 'Test 3P Finals',
    type: '3P',
    location: 'Cape Town Shooting Centre',
    description: 'Test 3-position finals (future).',
    status: 'open',
    date: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // next month
    maxParticipants: 80,
    currentParticipants: 0,
    isTestEvent: true,
  },
  {
    title: 'Test Air Rifle Invitational',
    type: 'Air Rifle',
    location: 'Johannesburg Indoor Range',
    description: 'Air rifle invitational (past) for history check.',
    status: 'closed',
    date: Timestamp.fromDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)), // two weeks ago
    maxParticipants: 40,
    currentParticipants: 32,
    isTestEvent: true,
  },
];

async function initAdmin() {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
      });
    } else {
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
      });
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const { isAdmin } = await verifyAdminFromToken(token);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    await initAdmin();
    const db = getFirestore();
    const auth = getAuth();

    if (req.method === 'POST') {
      // Seed test users
      const createdUsers: any[] = [];
      for (const u of TEST_USERS) {
        try {
          const userRecord = await auth.createUser({
            email: u.email,
            password: u.password,
            displayName: `${u.firstName} ${u.lastName}`,
          });
          await db.collection('users').doc(userRecord.uid).set({
            ...u,
            id: userRecord.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          createdUsers.push({ email: u.email, uid: userRecord.uid });
        } catch (err: any) {
          // If user exists, just update Firestore doc
          const existing = await auth.getUserByEmail(u.email).catch(() => null);
          if (existing) {
            await db.collection('users').doc(existing.uid).set({
              ...u,
              id: existing.uid,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
            createdUsers.push({ email: u.email, uid: existing.uid, note: 'updated' });
          } else {
            console.error('Failed to create test user', u.email, err);
          }
        }
      }

      // Seed test events
      const createdEvents: any[] = [];
      for (const ev of TEST_EVENTS) {
        const docRef = await db.collection('events').add({
          ...ev,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        createdEvents.push({ id: docRef.id, title: ev.title });
      }

      return res.status(201).json({
        success: true,
        message: 'Test users and events created',
        users: createdUsers,
        events: createdEvents,
      });
    }

    if (req.method === 'DELETE') {
      // Cleanup test events
      const eventsSnap = await db.collection('events').where('isTestEvent', '==', true).get();
      let deletedEvents = 0;
      for (const doc of eventsSnap.docs) {
        await doc.ref.delete();
        deletedEvents++;
      }

      // Cleanup test users
      const usersSnap = await db.collection('users').where('isTestUser', '==', true).get();
      let deletedUsers = 0;
      for (const doc of usersSnap.docs) {
        const uid = doc.id;
        await doc.ref.delete();
        try {
          await auth.deleteUser(uid);
        } catch {
          // ignore if user already deleted
        }
        deletedUsers++;
      }

      return res.status(200).json({
        success: true,
        message: 'Test users and events deleted',
        deletedEvents,
        deletedUsers,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Seed-test-data error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}








