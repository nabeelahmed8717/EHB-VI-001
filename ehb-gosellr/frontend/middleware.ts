import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('gosellr_token')?.value;

  // If no token, redirect to login for protected routes
  if (!token) {
    if (pathname.startsWith('/seller') || pathname.startsWith('/buyer')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/seller/:path*', '/buyer/:path*'],
};
