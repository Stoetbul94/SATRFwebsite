import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminFromToken } from '@/lib/admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const { isAdmin, userId } = await verifyAdminFromToken(token);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  try {
    // Initialize Firebase Admin SDK
    const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    if (!getApps().length) {
      try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : null;

        if (serviceAccount) {
          initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
          });
        } else {
          try {
            initializeApp({
              credential: applicationDefault(),
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
          } catch {
            initializeApp({
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
          }
        }
      } catch (initError) {
        console.error('Firebase Admin initialization error:', initError);
      }
    }

    const db = getFirestore();

    if (req.method === 'GET') {
      const snapshot = await db.collection('events')
        .orderBy('date', 'desc')
        .limit(1000)
        .get();
      
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ events });
    }

    if (req.method === 'POST') {
      try {
        // Parse and validate date
        let eventDate = req.body.date;
        if (!eventDate) {
          return res.status(400).json({ error: 'Date is required' });
        }

        // Convert date string to ISO format if needed
        if (typeof eventDate === 'string' && eventDate.includes('/')) {
          // Handle YYYY/MM/DD format
          const [year, month, day] = eventDate.split('/');
          eventDate = new Date(`${year}-${month}-${day}`).toISOString();
        } else if (typeof eventDate === 'string' && !eventDate.includes('T')) {
          // Handle YYYY-MM-DD format
          eventDate = new Date(eventDate + 'T00:00:00Z').toISOString();
        }

        const eventData = {
          title: req.body.title,
          date: eventDate,
          location: req.body.location,
          type: req.body.type,
          description: req.body.description || '',
          status: req.body.status || 'open',
          maxParticipants: req.body.maxParticipants ? parseInt(req.body.maxParticipants) : undefined,
          currentParticipants: 0,
          imageUrl: req.body.imageUrl || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Validate required fields
        if (!eventData.title || !eventData.date || !eventData.location || !eventData.type) {
          return res.status(400).json({ 
            error: 'Missing required fields: title, date, location, and type are required' 
          });
        }

        const docRef = await db.collection('events').add(eventData);

        // Log admin action (only if userId is available)
        if (userId) {
          try {
            await db.collection('adminActions').add({
              adminId: userId,
              action: 'create_event',
              targetId: docRef.id,
              details: eventData,
              timestamp: new Date().toISOString(),
            });
          } catch (logError) {
            console.warn('Failed to log admin action:', logError);
            // Don't fail the request if logging fails
          }
        }

        return res.status(201).json({ 
          success: true, 
          id: docRef.id,
          message: 'Event created successfully',
          event: { id: docRef.id, ...eventData }
        });
      } catch (error: any) {
        console.error('Error creating event:', error);
        return res.status(500).json({ 
          error: 'Failed to create event', 
          details: error.message 
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error handling events:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}


