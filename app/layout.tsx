import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./context/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
     title: "TBH",
     description: "Be authentic. Be kind. Be you.",
};

export default function RootLayout({
     children,
}: Readonly<{
     children: React.ReactNode;
}>) {
     return (
          <html lang="en">
               <AuthProvider>
                    <body className={inter.className}>{children}</body>
               </AuthProvider>
          </html>
     );
}