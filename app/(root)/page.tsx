import Hero from "@/components/landing/Hero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return (
    <main className="bg-neutral-950 min-h-[calc(100vh-60px)] py-4 flex flex-col gap-4 px-2 md:px-4">
      <Hero />
    </main>
  );
}