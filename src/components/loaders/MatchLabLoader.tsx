"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/ui";

interface MatchLabLoaderProps {
  className?: string;
}

export function MatchLabLoader({ className }: MatchLabLoaderProps) {
  return (
    <div className={cn("relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-950", className)}>
      {/* Soft gradient backdrop */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.25),transparent_65%)]"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orbiting particles */}
      {[...Array(10)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute h-1.5 w-1.5 rounded-full bg-violet-400/50"
          style={{
            left: `${10 + index * 8}%`,
            top: `${20 + (index % 4) * 15}%`,
          }}
          animate={{
            y: [0, -80, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1.1, 0.5],
          }}
          transition={{
            duration: 2.5 + index * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Dual ring loader */}
        <div className="relative h-28 w-28">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-violet-500/40 border-r-transparent"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border-4 border-fuchsia-500/40 border-l-transparent"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute inset-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 blur-lg"
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Messaging */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <h2 className="text-3xl font-bold text-slate-100">
            Preparing the Match Lab
          </h2>
          <motion.p
            className="text-slate-300/80"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Fetching your advanced match insights...
          </motion.p>
          <p className="text-sm text-slate-400">
            loading !
          </p>
        </motion.div>

        {/* Progress shimmer */}
        <div className="h-1 w-64 overflow-hidden rounded-full bg-slate-900/70">
          <motion.div
            className="h-full w-1/3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
}
