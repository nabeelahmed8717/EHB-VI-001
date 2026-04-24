import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'admin-key',
      name: 'Admin Key',
      credentials: {
        adminKey: { label: 'Admin Key', type: 'password' },
      },
      async authorize(credentials) {
        const expectedKey = process.env.NEXT_PUBLIC_EHB_ADMIN_KEY;
        if (!expectedKey) {
          throw new Error('EHB_ADMIN_KEY not configured on server');
        }
        if (credentials?.adminKey === expectedKey) {
          return {
            id: 'ehb-admin',
            name: 'EHB Admin',
            email: 'admin@ehb.internal',
            adminKey: credentials.adminKey,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist admin key in the JWT so it can be attached to API requests
        token['adminKey'] = (user as { adminKey?: string }).adminKey;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose admin key on the session object for RTK Query prepareHeaders
      (session as typeof session & { adminKey?: string }).adminKey =
        token['adminKey'] as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
