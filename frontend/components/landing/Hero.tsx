"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-24 pt-16 text-center lg:px-10 lg:pt-24">
      <div className="pointer-events-none absolute left-1/2 top-28 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500/30 blur-[110px]" />

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-200"
      >
        Conversational forms and workflows
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.1 }}
        className="relative mt-6 max-w-4xl font-serif text-5xl leading-[0.98] tracking-tight sm:text-6xl lg:text-8xl"
      >
        The form is only
        <br />
        the{" "}
        <span className="bg-gradient-to-r from-white via-fuchsia-200 to-fuchsia-500 bg-clip-text text-transparent">
          beginning
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="relative mt-8 max-w-2xl text-lg leading-8 text-zinc-200 sm:text-xl"
      >
        Build beautiful forms, collect thoughtful responses, and understand
        your audience through a focused one-question-at-a-time experience.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3 }}
        className="relative mt-9 flex flex-col gap-3 sm:flex-row"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-medium text-[#2b222d] transition hover:-translate-y-0.5 hover:bg-zinc-100"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>

        <a
          href="#features"
          className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 font-medium text-white transition hover:bg-white/10"
        >
          Explore features
        </a>
      </motion.div>
    </section>
  );
}