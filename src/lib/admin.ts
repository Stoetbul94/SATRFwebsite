/**
 * Admin verification utilities
 * Provides functions to verify admin access for both Firebase Auth and backend JWT tokens
 */

export interface AdminVerificationResult {
  isAdmin: boolean;
  email: string | null;
  userId: string | null;
  method?: string; // Which verification method was used
}

/**
 * Verify admin status from a token (supports Firebase Auth and backend JWT tokens)
 * This function tries multiple methods in order:
 * 1. Firebase Admin SDK (for Firebase Auth tokens)
 * 2. Backend API (for backend JWT tokens)
 * 3. Environment variable email whitelist
 * 4. Hardcoded dev email list
 */
export async function verifyAdminFromToken(token: string): Promise<AdminVerificationResult> {
  let isAdmin = false;
  let userEmail: string | null = null;
  let userId: string | null = null;
  let method: string | undefined = undefined;
  
  // Try to decode token to extract user info (works for both Firebase and JWT tokens)
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      userEmail = payload.email?.toLowerCase() || null;
      userId = payload.user_id || payload.sub || payload.uid || null;
    }
  } catch (decodeError) {
    // Token decode failed, will use other methods
  }
  
  // Method 1: Try Firebase Admin SDK verification (for Firebase Auth tokens)
  try {
    const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const { getAuth } = await import('firebase-admin/auth');
    
    // Initialize Firebase Admin if not already initialized
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
          // Try default credentials (for GCP/Cloud Run environments)
          try {
            initializeApp({
              credential: applicationDefault(),
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
          } catch {
            // Fallback: Initialize without credentials
            initializeApp({
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'satrf-website',
            });
          }
        }
      } catch (initError) {
        // Firebase Admin initialization failed, continue to other methods
      }
    }
    
    if (getApps().length > 0) {
      const adminAuth = getAuth();
      const adminDb = getFirestore();
      
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;
        userEmail = decodedToken.email?.toLowerCase() || userEmail;
        
        // Get user document from Firestore to check role
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          // Handle both role structures: 'role' (flat) or 'roles.admin' (nested)
          isAdmin = userData?.role === 'admin' || userData?.roles?.admin === true;
          if (isAdmin) {
            method = 'firebase-admin';
            return { isAdmin: true, email: userEmail, userId, method };
          }
        }
      } catch (verifyError: any) {
        // Not a Firebase token or verification failed, continue to next method
      }
    }
  } catch (importError) {
    // Firebase Admin SDK not available, continue to other methods
  }
  
  // Method 2: Try backend API (for backend JWT tokens)
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
    
    const userResponse = await fetch(`${API_BASE_URL}/${API_VERSION}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (userResponse.ok) {
      const user = await userResponse.json();
      isAdmin = user.role === 'admin';
      userEmail = user.email?.toLowerCase() || userEmail;
      userId = user.id || userId;
      if (isAdmin) {
        method = 'backend-api';
        return { isAdmin: true, email: userEmail, userId, method };
      }
    }
  } catch (error) {
    // Backend API unavailable, continue to fallback methods
  }
  
  // Method 3: Check environment variable for admin emails
  if (!isAdmin && userEmail) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
    if (adminEmails.includes(userEmail)) {
      method = 'email-whitelist';
      return { isAdmin: true, email: userEmail, userId, method };
    }
  }
  
  // Method 4: Check hardcoded admin emails for development
  if (!isAdmin && userEmail) {
    const devAdminEmails = [
      'demo@satrf.org.za',
      'admin@satrf.org.za',
      'techaim10.9@gmail.com',
    ];
    if (devAdminEmails.includes(userEmail)) {
      method = 'dev-email-list';
      return { isAdmin: true, email: userEmail, userId, method };
    }
  }
  
  return { isAdmin: false, email: userEmail, userId, method: 'none' };
}

/**
 * Check if a user email is in the admin whitelist
 */
export function isEmailAdmin(email: string | null): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  if (adminEmails.includes(normalizedEmail)) {
    return true;
  }
  
  // Check dev list
  const devAdminEmails = [
    'demo@satrf.org.za',
    'admin@satrf.org.za',
    'techaim10.9@gmail.com',
  ];
  return devAdminEmails.includes(normalizedEmail);
}

