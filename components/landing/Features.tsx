import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, Filter, Sparkles, User } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Features() {
  return (
    <section className="text-white rounded-[2rem] md:rounded-[4rem] bg-gradient-to-t from-[#fe831b] via-primary to-[#ed1980] w-full md:w-1/2 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-1">
            <h2 className="text-balance text-4xl font-semibold">
              Slide into anonymous Q&amp;A, threads, and more
            </h2>
            <Button className="mt-8 pr-2 text-black" variant="outline" asChild>
              <Link href="/dashboard">
                Try it now
                <ChevronRight className="size-4 opacity-50" />
              </Link>
            </Button>
          </div>

          <div className="space-y-6 md:col-span-1">
            <div className="flex items-center gap-4">
              <MessageCircleQuestion className="size-5" />
              <span className="flex-1 h-px bg-white/60 mx-1" />
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Anonymous Questions
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Replied Filters &amp; Threads
              </h3>
              <span className="flex-1 h-px bg-white/60 mx-1" />
              <Filter className="size-5" />
            </div>

            <div className="flex items-center gap-4">
              <Sparkles className="size-5" />
              <span className="flex-1 h-px bg-white/60 mx-1" />
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Daily AI Prompts
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Profile Customisations
              </h3>
              <span className="flex-1 h-px bg-white/60 mx-1" />
              <User className="size-5" />
            </div>
          </div>

          <div className="bg-background rounded-(--radius) relative mx-auto overflow-hidden border border-transparent shadow-lg shadow-black/10 ring-1 ring-black/10 w-full col-span-2 mt-auto">
            <Image
              src="/dashboard.png"
              alt="TBH Dashboard"
              width="2880"
              height="1842"
              className="aspect-video w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}