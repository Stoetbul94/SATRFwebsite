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
    const { getFirestore, Timestamp } = await import('firebase-admin/firestore');

    let db;
    let firebaseInitialized = false;

    if (!getApps().length) {
      console.log('[EVENT API] Initializing Firebase Admin SDK...');
      console.log('[EVENT API] Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website');
      console.log('[EVENT API] Service account key exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      
      try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : null;

        if (serviceAccount) {
          console.log('[EVENT API] Using service account credentials');
          initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
          });
          firebaseInitialized = true;
        } else {
          console.log('[EVENT API] No service account, trying application default...');
          try {
            initializeApp({
              credential: applicationDefault(),
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
            firebaseInitialized = true;
            console.log('[EVENT API] Initialized with application default credentials');
          } catch (defaultError: any) {
            console.warn('[EVENT API] Application default failed:', defaultError.message);
            // Last resort: initialize without credentials (may not work for writes)
            console.log('[EVENT API] Attempting initialization without credentials...');
            initializeApp({
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
            firebaseInitialized = true;
          }
        }
      } catch (initError: any) {
        console.error('[EVENT API] Firebase Admin initialization error:', initError.message);
        console.error('[EVENT API] Error stack:', initError.stack);
        return res.status(500).json({ 
          error: 'Firebase initialization failed', 
          details: initError.message 
        });
      }
    } else {
      firebaseInitialized = true;
      console.log('[EVENT API] Firebase Admin already initialized');
    }

    if (!firebaseInitialized) {
      return res.status(500).json({ 
        error: 'Firebase Admin SDK not initialized',
        details: 'Service account credentials may be missing. Check FIREBASE_SERVICE_ACCOUNT_KEY environment variable.'
      });
    }

    db = getFirestore();
    console.log('[EVENT API] Firestore instance obtained');

    if (req.method === 'GET') {
      const snapshot = await db.collection('events')
        .orderBy('date', 'desc')
        .limit(1000)
        .get();
      
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to ISO strings for consistency
          date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });

      return res.status(200).json({ events });
    }

    if (req.method === 'POST') {
      try {
        console.log('[EVENT CREATE] Starting event creation...');
        console.log('[EVENT CREATE] Request body:', JSON.stringify(req.body, null, 2));
        
        // Parse and validate date
        let eventDate = req.body.date;
        if (!eventDate) {
          console.error('[EVENT CREATE] Missing date');
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
          price: req.body.price ? parseFloat(req.body.price) : 0,
          imageUrl: req.body.imageUrl || null,
          payfastUrl: req.body.payfastUrl || null,
          eftInstructions: req.body.eftInstructions || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('[EVENT CREATE] Prepared event data:', JSON.stringify(eventData, null, 2));

        // Validate required fields
        if (!eventData.title || !eventData.date || !eventData.location || !eventData.type) {
          console.error('[EVENT CREATE] Missing required fields');
          return res.status(400).json({ 
            error: 'Missing required fields: title, date, location, and type are required' 
          });
        }

        // Verify Firebase Admin is initialized
        const apps = getApps();
        console.log('[EVENT CREATE] Firebase apps initialized:', apps.length > 0);
        
        if (apps.length === 0) {
          console.error('[EVENT CREATE] Firebase Admin not initialized');
          return res.status(500).json({ 
            error: 'Firebase Admin not initialized',
            details: 'Service account credentials may be missing'
          });
        }

        // Attempt to save to Firestore with timeout and better error handling
        console.log('[EVENT CREATE] Attempting to save to Firestore...');
        console.log('[EVENT CREATE] Event data to save:', JSON.stringify(eventData, null, 2));
        
        let docRef;
        try {
          // Prepare Firestore-compatible data
          const firestoreData: any = {
            title: eventData.title,
            location: eventData.location,
            type: eventData.type,
            description: eventData.description,
            status: eventData.status,
            currentParticipants: eventData.currentParticipants,
            imageUrl: eventData.imageUrl,
            payfastUrl: eventData.payfastUrl,
            eftInstructions: eventData.eftInstructions,
          };

          // Add optional fields only if they exist
          if (eventData.maxParticipants !== undefined) {
            firestoreData.maxParticipants = eventData.maxParticipants;
          }

          // Convert dates to Firestore Timestamps
          try {
            // Ensure date is valid before converting
            const dateObj = new Date(eventData.date);
            if (isNaN(dateObj.getTime())) {
              throw new Error('Invalid date format');
            }
            firestoreData.date = Timestamp.fromDate(dateObj);
            firestoreData.createdAt = Timestamp.now();
            firestoreData.updatedAt = Timestamp.now();
          } catch (dateError: any) {
            console.warn('[EVENT CREATE] Date conversion warning:', dateError.message);
            // Fallback to ISO strings if Timestamp conversion fails
            firestoreData.date = eventData.date;
            firestoreData.createdAt = new Date().toISOString();
            firestoreData.updatedAt = new Date().toISOString();
          }

          console.log('[EVENT CREATE] Firestore data prepared:', JSON.stringify(firestoreData, null, 2));
          
          // Use Promise.race with timeout
          const savePromise = db.collection('events').add(firestoreData);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore save timeout after 15 seconds')), 15000)
          );

          docRef = await Promise.race([savePromise, timeoutPromise]) as any;
          console.log('[EVENT CREATE] Event saved successfully with ID:', docRef.id);
          
          // Verify the document was actually created
          const savedDoc = await db.collection('events').doc(docRef.id).get();
          if (!savedDoc.exists) {
            throw new Error('Event document was not created in Firestore');
          }
          console.log('[EVENT CREATE] Verified document exists in Firestore');
          console.log('[EVENT CREATE] Document data:', savedDoc.data());
        } catch (saveError: any) {
          console.error('[EVENT CREATE] Firestore save error:', saveError);
          console.error('[EVENT CREATE] Error code:', saveError.code);
          console.error('[EVENT CREATE] Error message:', saveError.message);
          console.error('[EVENT CREATE] Error stack:', saveError.stack);
          
          // Provide more helpful error message
          let errorMessage = 'Failed to save to Firestore';
          if (saveError.code === 'permission-denied') {
            errorMessage = 'Permission denied. Check Firestore rules and Firebase Admin credentials.';
          } else if (saveError.code === 'unavailable') {
            errorMessage = 'Firestore service unavailable. Check your internet connection.';
          } else if (saveError.message) {
            errorMessage = saveError.message;
          }
          
          throw new Error(errorMessage);
        }

        // Log admin action (only if userId is available) - don't block on this
        if (userId) {
          try {
            await db.collection('adminActions').add({
              adminId: userId,
              action: 'create_event',
              targetId: docRef.id,
              details: eventData,
              timestamp: new Date().toISOString(),
            });
            console.log('[EVENT CREATE] Admin action logged');
          } catch (logError: any) {
            console.warn('[EVENT CREATE] Failed to log admin action:', logError.message);
            // Don't fail the request if logging fails
          }
        }

        console.log('[EVENT CREATE] Returning success response');
        return res.status(201).json({ 
          success: true, 
          id: docRef.id,
          message: 'Event created successfully',
          event: { id: docRef.id, ...eventData }
        });
      } catch (error: any) {
        console.error('[EVENT CREATE] Error creating event:', error);
        console.error('[EVENT CREATE] Error stack:', error.stack);
        console.error('[EVENT CREATE] Error name:', error.name);
        console.error('[EVENT CREATE] Error message:', error.message);
        
        return res.status(500).json({ 
          error: 'Failed to create event', 
          details: error.message || 'Unknown error occurred',
          errorType: error.name || 'Unknown'
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error handling events:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}


