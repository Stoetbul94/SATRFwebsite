import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Edge-runtime safe middleware - only uses next/server APIs
  // No Firebase Admin, no JWT libraries, no eval, no crypto
  // 
  // IMPORTANT: This middleware ONLY checks for authentication (cookie presence)
  // It does NOT verify admin status. Admin verification happens in:
  // 1. API routes: /api/admin/* use verifyAdminFromToken()
  // 2. Client-side: useAdminRoute() hook in admin pages
  
  // Redirect unauthenticated users from admin routes to login
  if (pathname.startsWith('/admin')) {
    // Check for authentication cookie (set by login API route)
    // Cookie names: 'auth_token' or 'access_token' (depending on auth system)
    const authToken = request.cookies.get('auth_token')?.value || 
                     request.cookies.get('access_token')?.value;
    
    // If no auth cookie found, redirect to login
    // This is ONLY an authentication check, NOT an admin verification
    // Admin verification happens in API routes via verifyAdminFromToken()
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 