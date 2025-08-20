"use client";

import SparklesText from "@/components/magicui/sparkles-text";
import Floating, { FloatingElement } from "@/components/ui/parallax-floating";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <div className="space-y-4 rounded-[2rem] py-20 sm:py-30 md:py-40 h-[calc(100vh-260px)] flex flex-col items-center justify-center text-center bg-gradient-to-t from-[#fe831b] via-primary to-[#ed1980]">
      <div className="z-0">
        <Floating sensitivity={-0.5} className="overflow-hidden">
          <FloatingElement
            depth={1.5}
            className="top-[16%] left-[15%] md:top-[17%] md:left-[25%]"
          >
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              src="/cat.png"
              className="w-28 h-28 sm:w-56 sm:h-56"
            />
          </FloatingElement>
        </Floating>
        <Floating sensitivity={1} className="overflow-hidden">
          <FloatingElement depth={1} className="top-[16%] left-[65%]">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              src="/crown.png"
              className="w-24 h-24 sm:w-52 sm:h-52"
            />
          </FloatingElement>
        </Floating>
        <Floating sensitivity={-1} className="overflow-hidden">
          <FloatingElement
            depth={1}
            className="top-[45%] md:top-[46%] left-[30%]"
          >
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              src="/skull.png"
              className="w-32 h-32 sm:w-52 sm:h-52"
            />
          </FloatingElement>
        </Floating>
      </div>

      <div className="z-0">
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
          className="text-pink-600 mt-5 px-6 py-3 md:px-10 md:py-5 rounded-full font-extrabold text-lg sm:text-2xl shadow-lg transition-transform duration-150 border-none outline-none hover:scale-110 cursor-pointer bg-white flex flex-row items-center w-fit mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.45,
          }}
        >
          Create my profile
          <ArrowRight className="ml-2 sm:ml-4" />
        </motion.a>
      </div>
    </div>
  );
}