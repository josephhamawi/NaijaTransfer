import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { crmIdentify, crmTrack } from "@/lib/crm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "email-otp",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email as string;

        let user = await db.user.findUnique({ where: { email } });
        if (!user) {
          user = await db.user.create({
            data: { email, name: email.split("@")[0] },
          });
          // New email-OTP signup — mirror to CRM (no-op if CRM unset).
          crmIdentify(user.id, { email: user.email, displayName: user.name, phone: user.phone });
          crmTrack(user.id, "signup", { method: "email-otp" });
        }
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        const dbUser = await db.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          token.tier = dbUser.tier;
          token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as unknown as Record<string, unknown>).id = token.userId;
        (session.user as unknown as Record<string, unknown>).tier = token.tier || "FREE";
      }
      return session;
    },
  },
  events: {
    // Fires when the Prisma adapter creates a user (e.g. Google sign-in).
    // The email-OTP path creates users directly, so it's tracked there instead.
    async createUser({ user }) {
      crmIdentify(user.id, { email: user.email, displayName: user.name });
      crmTrack(user.id, "signup", { method: "oauth" });
    },
  },
});
