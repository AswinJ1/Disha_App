import type { NextAuthConfig } from "next-auth"
import NextAuth from "next-auth"

// Lightweight auth config for middleware - no Prisma, no bcrypt
// This config is used only for middleware to avoid bundling heavy dependencies
export const authConfig: NextAuthConfig = {
    providers: [], // Providers are configured in the full auth.ts
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
}

export const { auth: authMiddleware } = NextAuth(authConfig)
