"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Star,
} from "lucide-react";

import { publicFormsApi } from "@/lib/api";
import type { AnswerPayload, Question } from "@/types/form";

interface PageProps {
  params: Promise<{ slug: string }>;
}

type AnswerValue = string | number | boolean | null;

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

function validateAnswer(
  question: Question,
  value: AnswerValue,
): string | null {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");

  if (question.required && isEmpty) {
    return "This question is required.";
  }

  if (isEmpty) {
    return null;
  }

  if (
    question.type === "email" &&
    typeof value === "string" &&
    !EMAIL_PATTERN.test(value.trim())
  ) {
    return "Please enter a valid email address.";
  }

  if (
    question.type === "number" &&
    typeof value === "string" &&
    Number.isNaN(Number(value))
  ) {
    return "Please enter a valid number.";
  }

  return null;
}

export default function PublicFormPage({ params }: PageProps) {
  const { slug } = use(params);

  const {
    data: form,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["public-form", slug],
    queryFn: () => publicFormsApi.getBySlug(slug),
  });

  const questions = useMemo(
    () =>
      form
        ? [...form.questions].sort(
            (first, second) => first.position - second.position,
          )
        : [],
    [form],
  );

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<
    Record<number, AnswerValue>
  >({});
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(
    null,
  );

  const currentQuestion = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex, started]);

  const submitMutation = useMutation({
    mutationFn: (payloadAnswers: AnswerPayload[]) =>
      publicFormsApi.submit(slug, { answers: payloadAnswers }),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const goToQuestion = useCallback(
    (index: number, dir: 1 | -1) => {
      if (index < 0 || index >= questions.length) {
        return;
      }

      setDirection(dir);
      setCurrentIndex(index);
      setFieldError(null);
    },
    [questions.length],
  );

  const handleNext = useCallback(() => {
    if (!currentQuestion) {
      return;
    }

    const value = answers[currentQuestion.id] ?? null;
    const validationError = validateAnswer(currentQuestion, value);

    if (validationError) {
      setFieldError(validationError);
      return;
    }

    if (!isLastQuestion) {
      goToQuestion(currentIndex + 1, 1);
      return;
    }

    const payloadAnswers: AnswerPayload[] = questions
      .filter((question) => {
        const answerValue = answers[question.id];
        return (
          answerValue !== undefined &&
          answerValue !== null &&
          answerValue !== ""
        );
      })
      .map((question) => ({
        question_id: question.id,
        value: answers[question.id] ?? null,
      }));

    submitMutation.mutate(payloadAnswers);
  }, [
    answers,
    currentIndex,
    currentQuestion,
    goToQuestion,
    isLastQuestion,
    questions,
    submitMutation,
  ]);

  const handlePrevious = useCallback(() => {
    goToQuestion(currentIndex - 1, -1);
  }, [currentIndex, goToQuestion]);

  useEffect(() => {
    if (!started || submitted) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [started, submitted, handleNext]);

  function setAnswer(questionId: number, value: AnswerValue) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
    setFieldError(null);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#2b222d]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </main>
    );
  }

  if (isError || !form) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#2b222d] px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-white">
            This form isn&apos;t available
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {error instanceof Error
              ? error.message
              : "The form may be unpublished or no longer exists."}
          </p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <ThankYouScreen
        title={form.thank_you_title}
        description={form.thank_you_description}
      />
    );
  }

  if (!started) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#2b222d] px-6 text-center text-white">
        <p className="text-sm font-medium uppercase tracking-widest text-fuchsia-300">
          {questions.length}{" "}
          {questions.length === 1 ? "question" : "questions"}
        </p>

        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          {form.title}
        </h1>

        {form.description && (
          <p className="mt-5 max-w-xl text-lg leading-7 text-zinc-300">
            {form.description}
          </p>
        )}

        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-medium text-[#2b222d] transition hover:bg-zinc-100"
        >
          Start
          <Check className="h-4 w-4" />
        </button>

        <p className="mt-4 text-xs text-zinc-500">
          press Enter ↵
        </p>
      </main>
    );
  }

  if (questions.length === 0 || !currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#2b222d] px-6 text-center text-white">
        <p>This form doesn&apos;t have any questions yet.</p>
      </main>
    );
  }

  const progress =
    questions.length > 0
      ? ((currentIndex + 1) / questions.length) * 100
      : 0;

  return (
    <main className="flex min-h-screen flex-col bg-[#2b222d] text-white">
      <div className="h-1.5 w-full bg-white/10">
        <motion.div
          className="h-full bg-fuchsia-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              initial={{
                opacity: 0,
                y: direction === 1 ? 24 : -24,
              }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: direction === 1 ? -24 : 24,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <p className="text-sm font-medium text-fuchsia-300">
                {currentIndex + 1} → {questions.length}
              </p>

              <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                {currentQuestion.title}
                {currentQuestion.required && (
                  <span className="ml-1 text-fuchsia-300">*</span>
                )}
              </h2>

              {currentQuestion.description && (
                <p className="mt-4 text-base leading-7 text-zinc-300">
                  {currentQuestion.description}
                </p>
              )}

              <div className="mt-10">
                <QuestionInput
                  question={currentQuestion}
                  value={answers[currentQuestion.id] ?? null}
                  onChange={(value) =>
                    setAnswer(currentQuestion.id, value)
                  }
                  onSubmit={handleNext}
                  inputRef={inputRef}
                />
              </div>

              {fieldError && (
                <p className="mt-4 text-sm font-medium text-red-300">
                  {fieldError}
                </p>
              )}

              <div className="mt-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-[#2b222d] transition hover:bg-zinc-100 disabled:opacity-60"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isLastQuestion ? (
                    "Submit"
                  ) : (
                    "OK"
                  )}
                  {!submitMutation.isPending && (
                    <Check className="h-4 w-4" />
                  )}
                </button>

                <p className="text-xs text-zinc-400">
                  press Enter ↵
                </p>
              </div>

              {submitMutation.isError && (
                <p className="mt-3 text-sm font-medium text-red-300">
                  {submitMutation.error instanceof Error
                    ? submitMutation.error.message
                    : "Unable to submit your response."}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-8">
        <button
          type="button"
          aria-label="Previous question"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Next question"
          onClick={handleNext}
          disabled={
            isLastQuestion && submitMutation.isPending
          }
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}

interface QuestionInputProps {
  question: Question;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onSubmit: () => void;
  inputRef: React.RefObject<
    HTMLInputElement | HTMLTextAreaElement | null
  >;
}

function QuestionInput({
  question,
  value,
  onChange,
  onSubmit,
  inputRef,
}: QuestionInputProps) {
  if (question.type === "long_text") {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type your answer here..."
        className="min-h-32 w-full resize-none border-b border-white/40 bg-transparent py-3 text-xl outline-none placeholder:text-zinc-500"
      />
    );
  }

  if (
    question.type === "short_text" ||
    question.type === "email" ||
    question.type === "number"
  ) {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={
          question.type === "email"
            ? "email"
            : question.type === "number"
              ? "number"
              : "text"
        }
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Type your answer here..."
        className="w-full border-b border-white/40 bg-transparent py-3 text-xl outline-none placeholder:text-zinc-500"
      />
    );
  }

  if (question.type === "yes_no") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {["Yes", "No"].map((option) => {
          const isSelected =
            value === option.toLowerCase();

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option.toLowerCase())}
              className={`rounded-xl border px-4 py-3 text-left text-lg transition ${
                isSelected
                  ? "border-fuchsia-300 bg-fuchsia-400/20"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "rating") {
    const rating = typeof value === "string" ? Number(value) : 0;

    return (
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const ratingValue = index + 1;
          const isFilled = ratingValue <= rating;

          return (
            <button
              key={ratingValue}
              type="button"
              aria-label={`Rate ${ratingValue} out of 5`}
              onClick={() => onChange(String(ratingValue))}
              className="transition hover:scale-110"
            >
              <Star
                className={`h-9 w-9 ${
                  isFilled
                    ? "fill-fuchsia-300 text-fuchsia-300"
                    : "text-zinc-500"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "dropdown") {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-lg text-white outline-none [&>option]:text-black"
      >
        <option value="" disabled>
          Select an option
        </option>
        {question.options.map((option, index) => (
          <option
            key={`${option.label}-${index}`}
            value={option.label}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "multiple_choice") {
    return (
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = value === option.label;

          return (
            <button
              key={`${option.label}-${index}`}
              type="button"
              onClick={() => onChange(option.label)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-lg transition ${
                isSelected
                  ? "border-fuchsia-300 bg-fuchsia-400/20"
                  : "border-white/20 bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/30 text-sm">
                {String.fromCharCode(65 + index)}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}

interface ThankYouScreenProps {
  title: string;
  description: string | null;
}

function ThankYouScreen({
  title,
  description,
}: ThankYouScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#2b222d] px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-400/20 text-fuchsia-300">
        <Check className="h-8 w-8" />
      </div>

      <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight">
        {title}
      </h1>

      {description && (
        <p className="mt-4 max-w-md text-lg leading-7 text-zinc-300">
          {description}
        </p>
      )}
    </main>
  );
}
