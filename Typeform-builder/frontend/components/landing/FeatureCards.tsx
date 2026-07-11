"use client";

import { BarChart3, Blocks, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Sparkles,
    title: "Build forms with ease",
    description:
      "Create polished conversational forms with multiple question types and live preview.",
  },
  {
    icon: BarChart3,
    title: "Understand every response",
    description:
      "Review submissions, inspect individual answers, and see simple question-level insights.",
  },
  {
    icon: Blocks,
    title: "Publish and share instantly",
    description:
      "Turn drafts into public forms and share a clean, no-login respondent experience.",
  },
];

export function FeatureCards() {
  return (
    <section
      id="features"
      className="mx-auto grid w-full max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-3 lg:px-10"
    >
      {features.map((feature, index) => {
        const Icon = feature.icon;

        return (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="group min-h-[320px] rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[0.07]"
          >
            <div className="inline-flex rounded-2xl bg-fuchsia-400/15 p-3 text-fuchsia-200">
              <Icon className="h-6 w-6" />
            </div>

            <h2 className="mt-20 text-3xl font-semibold tracking-tight">
              {feature.title}
            </h2>

            <p className="mt-4 text-base leading-7 text-zinc-300">
              {feature.description}
            </p>
          </motion.article>
        );
      })}
    </section>
  );
}