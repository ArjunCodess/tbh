import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import AuthProvider from "./context/AuthProvider";
import { Toaster } from "@/components/ui/sonner"
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BricolageGrotesque = Bricolage_Grotesque({ subsets: ["latin"] });

export const metadata: Metadata = {
     title: "TBH",
     description: "Be authentic. Be honest. Be you. TBH is a new way to q&a; the app provides a safe space for users to connect with friends and be their authentic selves.",
};

export default function RootLayout({
     children,
}: Readonly<{
     children: React.ReactNode;
}>) {
     return (
          <html lang="en">
               <AuthProvider>
                    <body className={BricolageGrotesque.className}>
                         <Navbar />
                         {children}
                         <Toaster />
                         <Footer />
                    </body>
               </AuthProvider>
          </html>
     );
}