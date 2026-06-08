import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      agencyId: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    agencyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    agencyId: string;
  }
}

/**
 * Base NextAuth configuration shared between middleware and API routes.
 * No Prisma adapter or database imports — safe for Edge Runtime.
 * Uses direct type annotation so callback parameters are contextually typed.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.agencyId = user.agencyId as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.agencyId = token.agencyId;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};
