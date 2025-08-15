import { motion } from "framer-motion";

type SpeechBubbleProps = {
  text: string;
  className?: string;
  variant?: "left" | "right";
};

export default function SpeechBubble({
  text,
  className = "",
  variant = "right",
}: SpeechBubbleProps) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bg-white rounded-[2rem] px-3 py-2 max-w-xs md:max-w-sm shadow-lg">
        <p className="text-black text-balance text-sm md:text-lg font-semibold text-center leading-relaxed">
          {text}
        </p>
      </div>
      {variant === "right" ? (
        <div className="absolute right-6 bottom-0 translate-y-1/2">
          <div className="w-0 h-0 border-t-white border-l-transparent border-t-[22px] border-l-[22px]"></div>
        </div>
      ) : (
        <div className="absolute left-6 bottom-0 translate-y-1/2">
          <div className="w-0 h-0 border-t-[22px] border-t-white border-r-[22px] border-r-transparent"></div>
        </div>
      )}
    </motion.div>
  );
}