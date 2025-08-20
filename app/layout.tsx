import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthProvider from "@/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

const BricolageGrotesque = Bricolage_Grotesque({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | TBH",
    default: "TBH",
  },
  description:
    "TBH is an anonymous QnA app where friends can send you questions, you can reply in public, make threads, and keep the fun going.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={BricolageGrotesque.className}>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />

          <Toaster />

          <Analytics />
          <Script
            defer
            data-domain="mytbh.vercel.app"
            src="https://getanalyzr.vercel.app/tracking-script.js"
          />
        </AuthProvider>
      </body>
    </html>
  );
}