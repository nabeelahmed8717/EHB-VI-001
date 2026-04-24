export { default } from 'next-auth/middleware';

export const config = {
  // Protect all /dashboard/* routes
  matcher: [
    '/overview/:path*',
    '/sq-requests/:path*',
    '/edr/:path*',
    '/franchise/:path*',
    '/rule-engine/:path*',
    '/criteria/:path*',
    '/platforms/:path*',
    '/audit/:path*',
    // Also protect the root dashboard redirect page
    '/(dashboard)/:path*',
  ],
};
