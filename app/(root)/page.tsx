import Hero from "@/components/landing/Hero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return (
    <main className="bg-neutral-950 min-h-[calc(100vh-60px)] pt-4">
      <Hero />
    </main>
  );
}