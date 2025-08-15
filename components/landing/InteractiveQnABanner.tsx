"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SpeechBubble from "../ChatBubble";

type HoverKey = "ama" | "nhie" | "confessions";

type BannerConfig = Record<
  HoverKey,
  {
    label: string;
    bubbles: { text: string; className: string }[];
    images: { src: string; className: string }[];
  }
>;

const CONFIG: BannerConfig = {
  ama: {
    label: "ask me anything",
    bubbles: [
      {
        text: "wyd rn? 👀",
        className: "top-[20%] left-[4%] md:top-[25%] md:left-[6%]",
      },
      {
        text: "if u could ghost anyone, who & why? 💀",
        className: "top-[33%] left-[4%] md:top-[35%] md:left-[6%]",
      },
      {
        text: "spill: last time u simped hard? 😳",
        className: "top-[50%] right-[4%] md:top-[50%] md:right-[6%]",
      },
      {
        text: "what's ur most used emoji? drop it! 🫣",
        className: "top-[63%] right-[4%] md:top-[60%] md:right-[6%]",
      },
    ],
    images: [
      {
        src: "/crown.png",
        className: "hidden md:block md:w-28 md:top-[43%] md:left-[6%] rotate-3",
      },
      {
        src: "/laugh.png",
        className:
          "w-24 top-[15%] right-[12%] md:w-36 md:top-[25%] md:right-[10%] -rotate-6",
      },
      {
        src: "/skull.png",
        className:
          "w-20 top-[50%] left-[6%] md:w-24 md:top-[50%] md:left-[45%] rotate-12",
      },
    ],
  },
  nhie: {
    label: "never have i ever",
    bubbles: [
      {
        text: "nhie slid into dms & got left on read 😬",
        className: "top-[15%] left-[5%] md:top-[25%] md:left-[5%]",
      },
      {
        text: "nhie sent a risky snap & regretted it 😅",
        className: "top-[33%] left-[5%] md:top-[40%] md:left-[5%]",
      },
      {
        text: "nhie stalked my ex's new bae 👀",
        className: "top-[55%] right-[8%] md:top-[50%] md:right-[8%]",
      },
    ],
    images: [
      {
        src: "/skull.png",
        className:
          "w-20 top-[40%] left-[15%] rotate-12 md:w-28 md:top-[50%] md:left-[15%] -rotate-2",
      },
      {
        src: "/pizza.png",
        className: "w-16 bottom-[25%] right-[12%] -rotate-6 md:w-24 rotate-6",
      },
      {
        src: "/laugh.png",
        className: "w-28 top-[25%] right-0 md:w-40 md:top-[20%] -rotate-12",
      },
    ],
  },
  confessions: {
    label: "confessions",
    bubbles: [
      {
        text: "still bump 1d 🤫",
        className: "top-[20%] left-[8%] md:left-[10%]",
      },
      {
        text: "i fake afk to dodge calls 😅",
        className: "top-[30%] left-[10%] md:top-[35%]",
      },
      {
        text: "i've faked bad wifi to leave a group chat 💀",
        className: "top-[60%] right-[10%] md:top-[50%] md:right-[12%]",
      },
    ],
    images: [
      {
        src: "/pizza.png",
        className:
          "w-20 top-[25%] left-[70%] md:w-32 md:top-[25%] md:left-[70%] rotate-4",
      },
      {
        src: "/laugh.png",
        className:
          "w-16 bottom-[45%] left-[12%] md:bottom-[35%] md:w-24 -rotate-4",
      },
      {
        src: "/skull.png",
        className:
          "w-20 bottom-[40%] right-[20%] md:bottom-[25%] -rotate-12 rotate-8",
      },
    ],
  },
};

function getBubbleVariant(className: string): "left" | "right" {
  if (className.includes("left-")) return "left";
  if (className.includes("right-")) return "right";
  return "right";
}

export default function InteractiveHoverQnABanner() {
  const keys: HoverKey[] = ["ama", "nhie", "confessions"];
  const [activeIdx, setActiveIdx] = useState(0);
  const activeKey = keys[activeIdx];
  const activeCfg = CONFIG[activeKey];

  const handlePrev = () =>
    setActiveIdx((idx) => (idx === 0 ? keys.length - 1 : idx - 1));
  const handleNext = () =>
    setActiveIdx((idx) => (idx === keys.length - 1 ? 0 : idx + 1));

  return (
    <section className="relative w-full text-white overflow-hidden py-16 border border-white/30 rounded-[2rem] md:rounded-[4rem]">
      <div className="relative mx-auto max-w-[90rem] px-4 min-h-[80vh] md:min-h-[60vh] flex flex-col">
        {/* floating images and bubbles */}
        <div className="max-w-4xl mx-auto pointer-events-none absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`bubbles-${activeKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {activeCfg.bubbles.map((b, i) => (
                <SpeechBubble
                  key={i}
                  text={b.text}
                  className={`absolute ${b.className} max-w-[70vw] md:max-w-xs`}
                  variant={getBubbleVariant(b.className)}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`images-${activeKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {activeCfg.images.map((img, i) => (
                <motion.img
                  key={`${img.src}-${i}`}
                  src={img.src}
                  alt=""
                  className={`absolute ${img.className}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* title */}
        <h2 className="text-center font-extrabold tracking-tight text-4xl md:text-7xl leading-none mb-8 md:mb-0 z-10">
          threads of truth.
        </h2>

        {/* center interactive list or mobile nav */}
        <div className="mt-auto">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl md:text-5xl font-extrabold">
              {CONFIG[activeKey].label}
            </span>
            <div className="flex items-center gap-6 mt-2">
              <button
                aria-label="previous"
                onClick={handlePrev}
                className="text-white text-3xl font-bold px-2"
                tabIndex={0}
                type="button"
              >
                &#8592;
              </button>
              <button
                aria-label="next"
                onClick={handleNext}
                className="text-white text-3xl font-bold px-2"
                tabIndex={0}
                type="button"
              >
                &#8594;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}