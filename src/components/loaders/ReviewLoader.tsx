"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/ui";

interface ReviewLoaderProps {
  className?: string;
}

export function ReviewLoader({ className }: ReviewLoaderProps) {
  return (
    <div className={cn("relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950", className)}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.3),transparent_50%)]"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Pulsing orbs */}
      <motion.div
        className="absolute top-1/3 left-1/3 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/3 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <div className="relative z-10 text-center space-y-8">
        {/* Concentric rings spinner */}
        <div className="relative inline-flex items-center justify-center h-40 w-40">
          {/* Rotating outer ring */}
          <motion.div
            className="absolute h-36 w-36"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="h-full w-full rounded-full border-2 border-dashed border-violet-400/40" />
          </motion.div>

          {/* Counter-rotating middle ring */}
          <motion.div
            className="absolute h-28 w-28"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="h-full w-full rounded-full border-2 border-dotted border-indigo-400/50" />
          </motion.div>

          {/* Fast spinning inner ring */}
          <motion.div
            className="absolute h-20 w-20 rounded-full border-4 border-violet-500 border-r-transparent border-t-transparent"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Pulsing center */}
          <motion.div
            className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Outer glow */}
          <motion.div
            className="absolute h-40 w-40 rounded-full bg-violet-500/10 blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Title with shimmer effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-slate-100">
            Loading Match Review
          </h2>
          <motion.p
            className="text-sm text-slate-400"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Analyzing gameplay data...
          </motion.p>
        </motion.div>

        {/* Animated steps */}
        <div className="space-y-2">
          {["Loading match details", "Fetching timeline", "Preparing coach AI"].map((text, i) => (
            <motion.div
              key={text}
              className="flex items-center justify-center gap-2 text-xs text-slate-500"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.2 }}
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-violet-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
              <span>{text}</span>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          loading !
        </p>
      </div>
    </div>
  );
}
