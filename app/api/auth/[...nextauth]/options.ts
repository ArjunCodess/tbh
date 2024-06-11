import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/app/lib/connectToDatabase";
import UserModel from "@/app/lib/models/user.schema";

export const authOptions: NextAuthOptions = {
     providers: [
          CredentialsProvider({
               id: "credentials",
               name: "Credentials",
               credentials: {
                    email: { label: "Email", type: "text" },
                    password: { label: "Password", type: "password" }
               },

               async authorize(credentials: any): Promise<any> {
                    await connectToDatabase();

                    try {
                         const user = await UserModel.findOne({
                              $or: [
                                   { email: credentials.indentifier },
                                   { username: credentials.indentifier },
                              ]
                         });

                         if (!user) throw new Error('No user found with this email');

                         if (!user.isVerified) throw new Error('Please verify your account before login');

                         const isPasswordCorrect = await bcrypt.compare(user.password, credentials.password);

                         if (isPasswordCorrect) return user;
                         else throw new Error('Password is incorrect');
                    }

                    catch (error: any) {
                         throw new Error("Error :: options.ts : ", error);
                    }
               }
          })
     ],
     callbacks: {
          async jwt({ token, user }) {
               if (user) {
                    token._id = user._id?.toString();
                    token.isVerified = user.isVerified;
                    token.isAcceptingMessages = user.isAcceptingMessages;
                    token.username = user.username;
               }

               return token
          },
          async session({ session, token }) {
               if (token) {
                    session.user._id = token._id;
                    session.user.isVerified = token.isVerified;
                    session.user.isAcceptingMessages = token.isAcceptingMessages;
                    session.user.username = token.username;
               }

               return session
          },
     },
     pages: {
          signIn: "/sign-in",
          // signOut: "/sign-out",
     },
     session: {
          strategy: "jwt",
     },
     secret: process.env.NEXTAUTH_SECRET,
}