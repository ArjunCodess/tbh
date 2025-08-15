import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import InteractiveQnABanner from "@/components/landing/InteractiveQnABanner";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return (
    <main className="bg-neutral-950 min-h-[calc(100vh-60px)] py-4 flex flex-col gap-4 px-2 md:px-4">
      <Hero />
      <div className="flex flex-col md:flex-row gap-4">
        <InteractiveQnABanner />
        <Features />
      </div>
    </main>
  );
}