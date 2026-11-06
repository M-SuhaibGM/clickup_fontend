// frontend/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // For now, do nothing — let the client-side AppShell handle auth.
  // The AppShell will call fetchCurrentUser() and redirect to /login if not authenticated.
  return NextResponse.next();
}

export const config = {
  matcher: [], // Disable the proxy matcher entirely
};