"use client";

import { Plus, Trash2 } from "lucide-react";

import type {
  Question,
  QuestionType,
} from "@/types/form";

const questionTypes: Array<{
  value: QuestionType;
  label: string;
}> = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "dropdown", label: "Dropdown" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "yes_no", label: "Yes / No" },
  { value: "rating", label: "Rating" },
];

const CHOICE_TYPES: QuestionType[] = [
  "multiple_choice",
  "dropdown",
];

interface QuestionEditorProps {
  question: Question | null;
  onChange: (
    questionId: number,
    updates: Partial<Question>,
  ) => void;
}

export function QuestionEditor({
  question,
  onChange,
}: QuestionEditorProps) {
  if (!question) {
    return (
      <section className="flex min-w-0 flex-1 items-center justify-center bg-[#f7f7f5] p-8">
        <div className="max-w-sm text-center">
          <h2 className="text-xl font-semibold text-zinc-950">
            Select a question
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Choose a question from the left panel to edit its
            content and settings.
          </p>
        </div>
      </section>
    );
  }

  const currentQuestion = question;
  const isChoiceType = CHOICE_TYPES.includes(
    currentQuestion.type,
  );

  function handleTypeChange(nextType: QuestionType) {
    const wasChoiceType = CHOICE_TYPES.includes(
      currentQuestion.type,
    );
    const willBeChoiceType = CHOICE_TYPES.includes(nextType);

    if (willBeChoiceType && !wasChoiceType) {
      // Backend requires at least two options for choice types,
      // so seed sensible defaults when switching into one.
      onChange(currentQuestion.id, {
        type: nextType,
        options: [
          { label: "Option 1", position: 0 },
          { label: "Option 2", position: 1 },
        ],
      });

      return;
    }

    if (!willBeChoiceType && wasChoiceType) {
      onChange(currentQuestion.id, {
        type: nextType,
        options: [],
      });

      return;
    }

    onChange(currentQuestion.id, { type: nextType });
  }

  function handleAddOption() {
    const nextOptions = [
      ...currentQuestion.options,
      {
        label: `Option ${currentQuestion.options.length + 1}`,
        position: currentQuestion.options.length,
      },
    ];

    onChange(currentQuestion.id, { options: nextOptions });
  }

  function handleOptionLabelChange(
    index: number,
    label: string,
  ) {
    const nextOptions = currentQuestion.options.map(
      (option, optionIndex) =>
        optionIndex === index
          ? { ...option, label }
          : option,
    );

    onChange(currentQuestion.id, { options: nextOptions });
  }

  function handleDeleteOption(index: number) {
    if (currentQuestion.options.length <= 2) {
      return;
    }

    const nextOptions = currentQuestion.options
      .filter((_, optionIndex) => optionIndex !== index)
      .map((option, optionIndex) => ({
        ...option,
        position: optionIndex,
      }));

    onChange(currentQuestion.id, { options: nextOptions });
  }

  return (
    <section className="min-w-0 flex-1 overflow-y-auto bg-[#f7f7f5] p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900">
              Question type
            </label>

            <select
              value={question.type}
              onChange={(event) =>
                handleTypeChange(
                  event.target.value as QuestionType,
                )
              }
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
            >
              {questionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-zinc-900">
              Question
            </label>

            <textarea
              value={question.title}
              onChange={(event) =>
                onChange(question.id, {
                  title: event.target.value,
                })
              }
              className="min-h-28 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-lg font-medium outline-none transition focus:border-zinc-400"
              placeholder="Write your question"
            />
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-zinc-900">
              Description
            </label>

            <textarea
              value={question.description ?? ""}
              onChange={(event) =>
                onChange(question.id, {
                  description: event.target.value || null,
                })
              }
              className="min-h-24 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
              placeholder="Add optional help text"
            />
          </div>

          {isChoiceType && (
            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium text-zinc-900">
                Options
              </label>

              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-xs font-medium text-zinc-500">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <input
                      value={option.label}
                      onChange={(event) =>
                        handleOptionLabelChange(
                          index,
                          event.target.value,
                        )
                      }
                      placeholder={`Option ${index + 1}`}
                      className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                    />

                    <button
                      type="button"
                      aria-label={`Delete option ${index + 1}`}
                      onClick={() => handleDeleteOption(index)}
                      disabled={question.options.length <= 2}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddOption}
                className="mt-1 inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                <Plus className="h-4 w-4" />
                Add option
              </button>

              <p className="text-xs text-zinc-400">
                At least two options are required.
              </p>
            </div>
          )}

          <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl bg-zinc-50 p-4">
            <div>
              <p className="text-sm font-medium text-zinc-950">
                Required question
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Respondents must answer before continuing.
              </p>
            </div>

            <input
              type="checkbox"
              checked={question.required}
              onChange={(event) =>
                onChange(question.id, {
                  required: event.target.checked,
                })
              }
              className="h-5 w-5 accent-[#2b222d]"
            />
          </label>
        </div>
      </div>
    </section>
  );
}