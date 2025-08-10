import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      username?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      _id?: string | null;
    } | null;
  }

  interface User {
    id?: string;
    username?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    _id?: string | null;
  }
}