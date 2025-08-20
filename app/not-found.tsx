import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "404 – Page Not Found",
  description:
    "Sorry, we can't find that page. You'll find lots to explore on the home page.",
};

export default function NotFound() {
  return (
    <div className="bg-white dark:bg-gray-900 h-screen flex justify-center items-center">
      <main className="py-8 px-4 mx-auto max-w-[var(--breakpoint-xl)] lg:py-16 lg:px-6 flex flex-col items-center w-full">
        <header className="mx-auto max-w-[var(--breakpoint-sm)] text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
            Something&apos;s missing.
          </p>
        </header>
        <div className="mx-auto max-w-[var(--breakpoint-sm)] text-center">
          <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
            Sorry, we can&apos;t find that page.
            <br />
            You&apos;ll find lots to explore on the home page.
          </p>
          <Button asChild>
            <Link href="/" className="flex flex-row items-center">
              Back to Homepage
              <MoveRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}