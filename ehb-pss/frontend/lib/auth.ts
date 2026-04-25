import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { jwtVerify } from 'jose';

export const authOptions: NextAuthOptions = {
  providers: [
    /* ── 1. Classic admin-key login ── */
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

    /* ── 2. EHB SSO — token handed over by other EHB platforms ── */
    CredentialsProvider({
      id: 'ehb-sso',
      name: 'EHB SSO',
      credentials: {
        token: { label: 'EHB Token', type: 'text' },
      },
      async authorize(credentials) {
        const rawToken = credentials?.token;
        if (!rawToken) return null;

        const secret = process.env.EHB_JWT_SECRET;
        if (!secret) {
          throw new Error('EHB_JWT_SECRET not configured on server');
        }

        try {
          const { payload } = await jwtVerify(
            rawToken,
            new TextEncoder().encode(secret),
          );

          const sub   = payload.sub   as string | undefined;
          const email = payload['email'] as string | undefined;

          if (!sub || !email) return null;

          return {
            id:       sub,
            name:     email.split('@')[0],
            email,
            // Carry the raw EHB token so RTK Query can forward it to the backend
            ehbToken: rawToken,
          };
        } catch {
          // Invalid / expired token
          return null;
        }
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
        const u = user as { adminKey?: string; ehbToken?: string };
        token['adminKey'] = u.adminKey;
        token['ehbToken'] = u.ehbToken;
      }
      return token;
    },
    async session({ session, token }) {
      const s = session as typeof session & {
        adminKey?: string;
        ehbToken?: string;
      };
      s.adminKey = token['adminKey'] as string | undefined;
      s.ehbToken = token['ehbToken'] as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
