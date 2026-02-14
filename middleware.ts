import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const pathname = req.nextUrl.pathname;

    // Define route categories
    const isPublicRoute = pathname === '/';
    const isApiAuthRoute = pathname.startsWith('/api/auth');
    const isProtectedApiRoute = pathname.startsWith('/api/') && !isApiAuthRoute;
    const isDashboardRoute = pathname.startsWith('/dashboard');
    
    // Allow public routes and auth routes
    if (isPublicRoute || isApiAuthRoute) {
      return NextResponse.next();
    }

    // Protect all API routes except auth
    if (isProtectedApiRoute) {
      if (!isAuth) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Protect dashboard routes
    if (isDashboardRoute) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return NextResponse.next();
    }

    // For any other protected routes, redirect to home if not authenticated
    if (!isAuth) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Always allow public routes and auth routes
        if (pathname === '/' || pathname.startsWith('/api/auth')) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};