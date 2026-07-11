"use client";

import {
  Check,
  ChevronDown,
  Star,
} from "lucide-react";

import type { Question } from "@/types/form";

interface LivePreviewProps {
  question: Question | null;
  questionNumber: number;
  totalQuestions: number;
}

export function LivePreview({
  question,
  questionNumber,
  totalQuestions,
}: LivePreviewProps) {
  return (
    <aside className="hidden w-[420px] shrink-0 border-l border-zinc-200 bg-white xl:flex xl:flex-col">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-950">
          Live preview
        </h2>

        <p className="mt-1 text-xs text-zinc-500">
          Respondent experience
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-[#efe9f0] p-6">
        <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white/80 bg-[#2b222d] text-white shadow-2xl">
          <div className="h-1.5 bg-white/10">
            <div
              className="h-full bg-fuchsia-400 transition-all"
              style={{
                width:
                  totalQuestions > 0
                    ? `${(questionNumber / totalQuestions) * 100}%`
                    : "0%",
              }}
            />
          </div>

          <div className="min-h-[520px] p-8">
            {!question ? (
              <div className="flex min-h-[440px] items-center justify-center text-center">
                <p className="text-sm text-zinc-300">
                  Add or select a question to preview it.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-fuchsia-200">
                  {questionNumber} → 
                </p>

                <h3 className="mt-5 text-3xl font-semibold leading-tight">
                  {question.title}
                  {question.required && (
                    <span className="ml-1 text-fuchsia-300">
                      *
                    </span>
                  )}
                </h3>

                {question.description && (
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {question.description}
                  </p>
                )}

                <div className="mt-10">
                  {question.type === "long_text" && (
                    <textarea
                      disabled
                      placeholder="Type your answer here..."
                      className="min-h-28 w-full resize-none border-b border-white/40 bg-transparent py-3 text-lg outline-none placeholder:text-zinc-500"
                    />
                  )}

                  {[
                    "short_text",
                    "email",
                    "number",
                  ].includes(question.type) && (
                    <input
                      disabled
                      type={
                        question.type === "email"
                          ? "email"
                          : question.type === "number"
                            ? "number"
                            : "text"
                      }
                      placeholder="Type your answer here..."
                      className="w-full border-b border-white/40 bg-transparent py-3 text-lg outline-none placeholder:text-zinc-500"
                    />
                  )}

                  {question.type === "yes_no" && (
                    <div className="grid grid-cols-2 gap-3">
                      {["Yes", "No"].map((option) => (
                        <button
                          key={option}
                          disabled
                          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.type === "rating" && (
                    <div className="flex gap-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className="h-8 w-8 text-fuchsia-200"
                        />
                      ))}
                    </div>
                  )}

                  {question.type === "dropdown" && (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                      >
                        Select an option
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {question.options.length > 0 && (
                        <ul className="space-y-1 px-1 text-sm text-zinc-300">
                          {question.options.map(
                            (option, index) => (
                              <li
                                key={`${option.label}-${index}`}
                              >
                                {option.label}
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                  )}

                  {question.type === "multiple_choice" && (
                    <div className="space-y-3">
                      {(question.options.length > 0
                        ? question.options
                        : [
                            {
                              label: "Option 1",
                              position: 1,
                            },
                            {
                              label: "Option 2",
                              position: 2,
                            },
                          ]
                      ).map((option, index) => (
                        <button
                          key={`${option.label}-${index}`}
                          disabled
                          className="flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/30 text-xs">
                            {String.fromCharCode(65 + index)}
                          </span>

                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  disabled
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-[#2b222d]"
                >
                  OK
                  <Check className="h-4 w-4" />
                </button>

                <p className="mt-3 text-xs text-zinc-400">
                  press Enter ↵
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}