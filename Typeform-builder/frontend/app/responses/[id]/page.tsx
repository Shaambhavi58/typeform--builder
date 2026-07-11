"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { formsApi, responsesApi } from "@/lib/api";
import type {
  ResponseDetails,
  ResponseListItem,
} from "@/types/form";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export default function ResponsesPage({ params }: PageProps) {
  const { id } = use(params);
  const formId = Number(id);
  const hasValidFormId = Number.isInteger(formId) && formId > 0;

  const queryClient = useQueryClient();
  const [selectedResponseId, setSelectedResponseId] = useState<
    number | null
  >(null);
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: form,
    isLoading: isFormLoading,
    isError: isFormError,
  } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => formsApi.getById(formId),
    enabled: hasValidFormId,
  });

  const {
    data: responses,
    isLoading: isResponsesLoading,
  } = useQuery({
    queryKey: ["responses", formId],
    queryFn: () => responsesApi.getAll(formId),
    enabled: hasValidFormId,
  });

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["responses-summary", formId],
    queryFn: () => responsesApi.getSummary(formId),
    enabled: hasValidFormId,
  });

  const { data: selectedResponse, isLoading: isDetailLoading } =
    useQuery({
      queryKey: ["response", formId, selectedResponseId],
      queryFn: () =>
        responsesApi.getById(formId, selectedResponseId as number),
      enabled: hasValidFormId && selectedResponseId !== null,
    });

  const deleteMutation = useMutation({
    mutationFn: (responseId: number) =>
      responsesApi.delete(formId, responseId),
    onSuccess: async (_, responseId) => {
      if (selectedResponseId === responseId) {
        setSelectedResponseId(null);
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["responses", formId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["responses-summary", formId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["forms"],
        }),
      ]);

      toast.success("Response deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const sortedResponses = useMemo(
    () =>
      responses
        ? [...responses].sort(
            (first, second) =>
              new Date(second.submitted_at).getTime() -
              new Date(first.submitted_at).getTime(),
          )
        : [],
    [responses],
  );

  async function handleExportCsv() {
    if (!form || sortedResponses.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      const questions = [...form.questions].sort(
        (first, second) => first.position - second.position,
      );

      const details: ResponseDetails[] = await Promise.all(
        sortedResponses.map((item) =>
          responsesApi.getById(formId, item.id),
        ),
      );

      const header = [
        "Response ID",
        "Submitted at",
        ...questions.map((question) => question.title),
      ];

      const rows = details.map((detail) => {
        const answerMap = new Map(
          detail.answers.map((answer) => [
            answer.question_id,
            answer.value ?? "",
          ]),
        );

        return [
          String(detail.id),
          formatDate(detail.submitted_at),
          ...questions.map((question) =>
            String(answerMap.get(question.id) ?? ""),
          ),
        ];
      });

      const csvContent = [header, ...rows]
        .map((row) => row.map(csvEscape).join(","))
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${form.slug}-responses.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Responses exported.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to export responses.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  if (!hasValidFormId) {
    return (
      <ErrorState
        title="No form selected"
        description="Open responses from one of the form cards on your dashboard."
      />
    );
  }

  if (isFormLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2b222d]" />
      </main>
    );
  }

  if (isFormError || !form) {
    return (
      <ErrorState
        title="Unable to load this form"
        description="The requested form could not be found."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-5">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-zinc-950">
              {form.title}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Responses
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting || sortedResponses.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total responses"
            value={summary?.total_responses ?? 0}
            isLoading={isSummaryLoading}
          />
          <StatCard
            label="Questions"
            value={form.questions.length}
            isLoading={false}
          />
        </section>

        {summary && summary.questions.length > 0 && (
          <section className="mt-8 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-950">
              Summary
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {summary.questions.map((question) => (
                <div
                  key={question.question_id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5"
                >
                  <p className="text-sm font-medium text-zinc-950">
                    {question.question_title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {question.total_answers} answered ·{" "}
                    {question.skipped} skipped
                  </p>

                  {question.choices && (
                    <div className="mt-4 space-y-2">
                      {question.choices.map((choice) => (
                        <div key={choice.option}>
                          <div className="flex items-center justify-between text-xs text-zinc-600">
                            <span>{choice.option}</span>
                            <span>
                              {choice.count} ({choice.percentage}%)
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-[#2b222d]"
                              style={{
                                width: `${choice.percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.average !== null &&
                    question.average !== undefined && (
                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {question.average}
                        <span className="ml-1 text-sm font-normal text-zinc-400">
                          average
                        </span>
                      </p>
                    )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-950">
            All responses
          </h2>

          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {isResponsesLoading ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#2b222d]" />
              </div>
            ) : sortedResponses.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-zinc-800">
                  No responses yet
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Share your published form to start collecting
                  responses.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">
                      Submitted
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Answers
                    </th>
                    <th className="px-5 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResponses.map((item: ResponseListItem) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-b border-zinc-50 transition hover:bg-zinc-50"
                      onClick={() =>
                        setSelectedResponseId(item.id)
                      }
                    >
                      <td className="px-5 py-3 font-medium text-zinc-950">
                        #{item.id}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">
                        {formatDate(item.submitted_at)}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">
                        {item.answer_count}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          aria-label={`Delete response ${item.id}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (
                              window.confirm(
                                `Delete response #${item.id}?`,
                              )
                            ) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {selectedResponseId !== null && (
        <ResponseDetailPanel
          isLoading={isDetailLoading}
          response={selectedResponse ?? null}
          onClose={() => setSelectedResponseId(null)}
        />
      )}
    </main>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  isLoading: boolean;
}

function StatCard({ label, value, isLoading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-2xl font-semibold text-zinc-950">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          value
        )}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

interface ResponseDetailPanelProps {
  isLoading: boolean;
  response: ResponseDetails | null;
  onClose: () => void;
}

function ResponseDetailPanel({
  isLoading,
  response,
  onClose,
}: ResponseDetailPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-950">
            {response ? `Response #${response.id}` : "Response"}
          </h2>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !response ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#2b222d]" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <p className="text-xs text-zinc-400">
              Submitted {formatDate(response.submitted_at)}
            </p>

            {response.answers.map((answer) => (
              <div key={answer.question_id}>
                <p className="text-sm font-medium text-zinc-950">
                  {answer.question_title}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {answer.value ?? (
                    <span className="italic text-zinc-400">
                      Skipped
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  description: string;
}

function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {description}
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2b222d] px-5 text-sm font-medium text-white transition hover:bg-[#3a2c3d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
