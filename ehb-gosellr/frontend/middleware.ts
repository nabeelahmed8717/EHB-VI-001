import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * This app stores the auth token in localStorage (client-side only).
 * Next.js middleware runs on the server/edge and cannot read localStorage,
 * so any cookie-based auth check here would always fail for authenticated
 * users and incorrectly redirect them to /login.
 *
 * All authentication and role-based access control is handled properly by
 * the client-side route group layouts:
 *   - app/(buyer)/layout.tsx   → requires login; shows role-switch modal for non-buyers
 *   - app/(seller)/layout.tsx  → requires seller profile
 *   - app/(rider)/layout.tsx   → requires rider profile
 *
 * This middleware is intentionally a no-op passthrough.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
