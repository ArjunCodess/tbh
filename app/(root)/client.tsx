"use client";

import SparklesText from "@/components/magicui/sparkles-text";
import Floating, { FloatingElement } from "@/components/ui/parallax-floating";
import { motion } from "motion/react";
import { MoveRight } from "lucide-react";

export default function DashboardClient() {
  return (
    <main className="bg-neutral-950 min-h-[calc(100vh-60px)]">
      <div className="space-y-4 rounded-[2rem] md:rounded-[4rem] rounded-t-none md:rounded-t-none py-20 sm:py-30 md:py-40 h-[calc(100vh-90px)] flex flex-col items-center justify-center text-center bg-gradient-to-t from-[#fe831b] via-primary to-[#ed1980]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.15,
          }}
        >
          <SparklesText
            text="real questions."
            className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-white"
          />
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.3,
          }}
        >
          <SparklesText
            text="honest answers."
            className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-white"
          />
        </motion.div>
        <motion.a
          href="/sign-up"
          className="text-pink-600 mt-5 px-10 py-5 rounded-full font-extrabold text-2xl shadow-lg transition-transform duration-150 border-none outline-none hover:scale-110 cursor-pointer bg-white flex flex-row items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.45,
          }}
        >
          Create my profile
          <MoveRight className="ml-4" />
        </motion.a>

        <div className="z-0">
          <Floating sensitivity={-1} className="overflow-hidden">
            <FloatingElement depth={1.5} className="top-[28%] left-[20%]">
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                src="/cat.png"
                className="w-32 h-32 sm:w-56 sm:h-56"
              />
            </FloatingElement>
          </Floating>
          <Floating sensitivity={2} className="overflow-hidden">
            <FloatingElement depth={1} className="top-[24%] left-[65%]">
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                src="/crown.png"
                className="w-28 h-28 sm:w-52 sm:h-52"
              />
            </FloatingElement>
          </Floating>
          <Floating sensitivity={1} className="overflow-hidden">
            <FloatingElement depth={1} className="top-[53%] left-[25%]">
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                src="/skull.png"
                className="w-28 h-28 sm:w-52 sm:h-52"
              />
            </FloatingElement>
          </Floating>
        </div>
      </div>
    </main>
  );
}