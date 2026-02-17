import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Phone",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const member = await prisma.member.findUnique({
          where: { phone: credentials.phone },
          include: { party: true, province: true, district: true, tehsil: true },
        });

        if (!member) return null;

        const isValid = await bcrypt.compare(credentials.password, member.passwordHash);
        if (!isValid) return null;

        // Update last active
        await prisma.member.update({
          where: { id: member.id },
          data: { lastActiveAt: new Date() },
        });

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          partyId: member.partyId,
          provinceId: member.provinceId,
          districtId: member.districtId,
          tehsilId: member.tehsilId,
          referralCode: member.referralCode,
          membershipNumber: member.membershipNumber,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.partyId = (user as any).partyId;
        token.provinceId = (user as any).provinceId;
        token.districtId = (user as any).districtId;
        token.tehsilId = (user as any).tehsilId;
        token.referralCode = (user as any).referralCode;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).partyId = token.partyId;
        (session.user as any).provinceId = token.provinceId;
        (session.user as any).districtId = token.districtId;
        (session.user as any).tehsilId = token.tehsilId;
        (session.user as any).referralCode = token.referralCode;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
