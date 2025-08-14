import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import SparklesText from "@/components/magicui/sparkles-text";
import Floating, { FloatingElement } from "@/components/ui/parallax-floating";

export const metadata: Metadata = {
  title: "Home",
};

export default function Hero() {
  return (
    <main className="bg-neutral-950 py-4">
      <div className="z-50 space-y-4 rounded-3xl py-20 sm:py-30 md:py-40 h-[calc(100vh-90px)] flex flex-col items-center justify-center text-center bg-gradient-to-t from-[#fe831b] via-primary to-[#ed1980] mx-3 md:mx-5">
        <SparklesText
          text="real questions."
          className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-white"
        />
        <SparklesText
          text="honest answers."
          className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-white"
        />
      </div>

      <Floating sensitivity={-1} className="overflow-hidden">
        <FloatingElement depth={0.5} className="top-[28%] left-[21%]">
          <Image
            src="/cat.png"
            alt="cat"
            width={224}
            height={224}
            className="w-56 h-56"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[23%] left-[45%]">
          <Image
            src="/laugh.png"
            alt="laugh"
            width={160}
            height={160}
            className="w-40 h-40"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[26%] left-[72%]">
          <Image
            src="/crown.png"
            alt="crown"
            width={208}
            height={208}
            className="w-52 h-52"
          />
        </FloatingElement>
        <FloatingElement depth={2} className="top-[69%] left-[77%]">
          <Image
            src="/hi.png"
            alt="hi"
            width={192}
            height={192}
            className="w-48 h-48"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[76%] left-[56%]">
          <Image
            src="/pizza.png"
            alt="pizza"
            width={176}
            height={176}
            className="w-44 h-44"
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[70%] left-[20%]">
          <Image
            src="/skull.png"
            alt="skull"
            width={208}
            height={208}
            className="w-52 h-52"
          />
        </FloatingElement>
      </Floating>

      <div className="py-20 sm:py-30 md:py-40 max-w-5xl mx-auto">
        <div className="m-auto flex h-full w-full flex-col gap-8 px-4 py-4 md:px-6 md:py-10 text-center">
          <h1
            style={{ lineHeight: 1.5 }}
            className="text-3xl font-extrabold tracking-tight md:text-6xl text-white"
          >
            not just a{" "}
            <Image
              className="my-auto -mt-3 inline w-16 md:-mt-6 md:w-32"
              width={100}
              height={100}
              src="/ngl.png"
              alt="NGL Link Logo"
            />{" "}
            clone — this is{" "}
            <Image
              className="my-auto -mt-3 inline w-16 md:-mt-6 md:w-36 sm:w-28"
              width={100}
              height={100}
              src="/tbh.png"
              alt="Special Image Capabilities"
            />{" "}
            just better!
          </h1>
          <div className="md:w-11/12 flex md:flex-row flex-col md:space-x-5 space-y-3 md:space-y-0 space-x-0 w-full mx-auto">
            <Link
              href={"/sign-up"}
              className="md:w-1/2 md:text-base bg-gradient-to-tr from-yellow-500 via-orange-500 to-violet-500 rounded-full"
            >
              {" "}
              <button className="h-10 px-4 py-2 text-white">
                Create an account <ArrowRight className="w-5 h-5 inline" />
              </button>
            </Link>
            <Link
              href={"/dashboard"}
              className="border md:w-1/2 md:text-base rounded-full"
            >
              <button className="h-10 px-4 py-2 text-white">
                Go to your dashboard <ArrowRight className="w-5 h-5 inline" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}