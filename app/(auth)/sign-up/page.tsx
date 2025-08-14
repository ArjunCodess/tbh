import type { Metadata } from "next";
import SignUpClient from "./client";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignInPage() {
  return <SignUpClient />;
}