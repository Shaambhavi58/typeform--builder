"use client";

import { Plus, Trash2 } from "lucide-react";

import type {
  Question,
  QuestionOption,
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

interface QuestionEditorProps {
  question: Question | null;
  onChange: (
    questionId: number,
    updates: Partial<Question>,
  ) => void;
}

function isChoiceQuestion(type: QuestionType) {
  return type === "multiple_choice" || type === "dropdown";
}

function normalizeOptions(
  options: QuestionOption[],
): QuestionOption[] {
  return options.map((option, index) => ({
    ...option,
    position: index,
  }));
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

  function handleTypeChange(nextType: QuestionType) {
    const nextIsChoiceQuestion =
      isChoiceQuestion(nextType);

    let nextOptions: QuestionOption[] = [];

    if (nextIsChoiceQuestion) {
      nextOptions =
        question.options.length >= 2
          ? normalizeOptions(question.options)
          : [
              {
                label: "Option 1",
                position: 0,
              },
              {
                label: "Option 2",
                position: 1,
              },
            ];
    }

    onChange(question.id, {
      type: nextType,
      options: nextOptions,
    });
  }

  function handleOptionChange(
    optionIndex: number,
    label: string,
  ) {
    const updatedOptions = question.options.map(
      (option, index) => ({
        ...option,
        label:
          index === optionIndex
            ? label
            : option.label,
        position: index,
      }),
    );

    onChange(question.id, {
      options: updatedOptions,
    });
  }

  function handleAddOption() {
    const nextPosition = question.options.length;

    onChange(question.id, {
      options: [
        ...normalizeOptions(question.options),
        {
          label: `Option ${nextPosition + 1}`,
          position: nextPosition,
        },
      ],
    });
  }

  function handleDeleteOption(
    optionIndex: number,
  ) {
    if (question.options.length <= 2) {
      return;
    }

    const updatedOptions = question.options
      .filter((_, index) => index !== optionIndex)
      .map((option, index) => ({
        ...option,
        position: index,
      }));

    onChange(question.id, {
      options: updatedOptions,
    });
  }

  const choiceQuestion = isChoiceQuestion(
    question.type,
  );

  return (
    <section className="min-w-0 flex-1 overflow-y-auto bg-[#f7f7f5] p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
          <div className="space-y-2">
            <label
              htmlFor="question-type"
              className="text-sm font-medium text-zinc-900"
            >
              Question type
            </label>

            <select
              id="question-type"
              value={question.type}
              onChange={(event) =>
                handleTypeChange(
                  event.target.value as QuestionType,
                )
              }
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
            >
              {questionTypes.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 space-y-2">
            <label
              htmlFor="question-title"
              className="text-sm font-medium text-zinc-900"
            >
              Question
            </label>

            <textarea
              id="question-title"
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
            <label
              htmlFor="question-description"
              className="text-sm font-medium text-zinc-900"
            >
              Description
            </label>

            <textarea
              id="question-description"
              value={question.description ?? ""}
              onChange={(event) =>
                onChange(question.id, {
                  description:
                    event.target.value || null,
                })
              }
              className="min-h-24 w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
              placeholder="Add optional help text"
            />
          </div>

          {choiceQuestion && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Options
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    At least two options are required.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  <Plus className="h-4 w-4" />
                  Add option
                </button>
              </div>

              <div className="space-y-3">
                {question.options.map(
                  (option, index) => (
                    <div
                      key={option.id ?? index}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-500">
                        {String.fromCharCode(65 + index)}
                      </div>

                      <input
                        value={option.label}
                        onChange={(event) =>
                          handleOptionChange(
                            index,
                            event.target.value,
                          )
                        }
                        placeholder={`Option ${index + 1}`}
                        className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                      />

                      <button
                        type="button"
                        disabled={
                          question.options.length <= 2
                        }
                        onClick={() =>
                          handleDeleteOption(index)
                        }
                        aria-label={`Delete option ${index + 1}`}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                )}
              </div>
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