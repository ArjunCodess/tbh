import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="w-full text-white overflow-hidden py-12 md:py-20 border border-white/30 rounded-[2rem]">
      <div className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-between flex-col md:flex-row gap-4">
              <h2 className="text-balance text-3xl font-semibold lg:text-4xl text-center">
                Ask. Answer. Be Honest.
              </h2>
            <button className="text-primary px-6 py-3 md:px-10 md:py-5 rounded-full font-extrabold text-lg sm:text-2xl shadow-lg transition-transform duration-150 hover:scale-110 cursor-pointer bg-white">
              <Link href="/dashboard" className="flex flex-row items-center">
                Sign In
                <ArrowRight className="ml-2 sm:ml-4" />
              </Link>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}