import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, Filter, Sparkles, User } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Features() {
  return (
    <section className="text-white rounded-[2rem] bg-gradient-to-t from-[#fe831b] via-primary to-[#ed1980] w-full md:w-1/2 flex flex-col justify-center py-10 md:py-16">
      <div className="mx-auto w-full max-w-4xl px-4 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-1 col-span-2">
            <h2 className="text-balance text-3xl sm:text-4xl font-semibold">
              Slide into anonymous Q&amp;A, and threads
            </h2>
            <Button className="mt-8 pr-2 text-black w-full sm:w-auto" variant="outline" asChild>
              <Link href="/dashboard" className="flex items-center justify-center w-full sm:w-auto">
                Try it now
                <ChevronRight className="size-4 opacity-50" />
              </Link>
            </Button>
          </div>

          <div className="space-y-6 col-span-2 md:col-span-1">
            <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
              <MessageCircleQuestion className="size-5" />
              <span className="hidden sm:block flex-1 h-px bg-white/60 mx-1" />
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Anonymous Questions
              </h3>
            </div>

            <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Replied Filters &amp; Threads
              </h3>
              <span className="hidden sm:block flex-1 h-px bg-white/60 mx-1" />
              <Filter className="size-5" />
            </div>

            <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
              <Sparkles className="size-5" />
              <span className="hidden sm:block flex-1 h-px bg-white/60 mx-1" />
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Daily AI Prompts
              </h3>
            </div>

            <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
              <h3 className="text-lg font-semibold whitespace-nowrap">
                Profile Customisations
              </h3>
              <span className="hidden sm:block flex-1 h-px bg-white/60 mx-1" />
              <User className="size-5" />
            </div>
          </div>

          <div className="bg-background rounded-[0.5rem] md:rounded-[1rem] relative mx-auto overflow-hidden border border-transparent shadow-lg shadow-black/10 ring-1 ring-black/10 w-full col-span-2 mt-auto">
            <Image
              src="/dashboard.png"
              alt="TBH Dashboard"
              width="2880"
              height="1842"
              className="aspect-video w-full h-full object-cover"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}