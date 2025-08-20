import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";
import { ensureDailyPromptFreshForUserId } from "@/lib/services/dailyPrompt";

const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        await connectToDatabase();

        const user = await UserModel.findOne({
          $or: [
            { email: credentials.identifier },
            { username: credentials.identifier },
          ],
        }).select("+password");

        if (!user) return null;

        if (!user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: (user as any)._id.toString(),
          email: user.email,
          name: user.username,
          username: user.username,
          _id: (user as any)._id.toString(),
          isAcceptingMessages: user.isAcceptingMessages,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any)._id = (user as any)._id ?? (user as any).id;
        (token as any).username = (user as any).username ?? (user as any).name;
        (token as any).isAcceptingMessages = (user as any).isAcceptingMessages;
      }
      return token as any;
    },
    async session({ session, token }) {
      (session as any).user = {
        _id: (token as any)._id,
        email: session.user?.email,
        username: (token as any).username,
        isAcceptingMessages: (token as any).isAcceptingMessages,
      };
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        const userId = (user as any)?._id || (user as any)?.id;
        if (!userId) return;
        await connectToDatabase();
        await ensureDailyPromptFreshForUserId(String(userId));
      } catch (err) {
        console.error("[events.signIn] failed to refresh daily prompt", err);
      }
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;