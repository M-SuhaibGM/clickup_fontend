// frontend/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect the dashboard: if no refresh cookie, send to login
  // Your backend sets "refreshToken" as an HttpOnly cookie on localhost:5000
  if (pathname.startsWith('/dashboard')) {
    const refreshToken = request.cookies.get('refreshToken');

    if (!refreshToken) {
      const loginUrl = new URL('/login', request.url);
      // Optional: remember where the user wanted to go
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Allow the request to continue
  return NextResponse.next();
}

export const config = {
  // Only run proxy on these paths (avoids overhead on static assets)
  matcher: ['/dashboard/:path*'],
};