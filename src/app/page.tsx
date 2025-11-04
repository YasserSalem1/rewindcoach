"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { SearchCard } from "@/components/SearchCard";

export default function Home() {
  return (
    <section className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex w-full flex-col items-center gap-10"
        >
          <Image
            src="/images/Logo.png"
            alt="RewindCoach"
            width={500}
            height={500}
            priority
            className="drop-shadow-[0_35px_120px_rgba(99,102,241,0.3)]"
          />
          <SearchCard className="w-full" />
        </motion.div>
      </div>
    </section>
  );
}
