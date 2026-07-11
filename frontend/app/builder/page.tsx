"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import { BuilderShell } from "@/components/builder/BuilderShell";
import { formsApi } from "@/lib/api";

function BuilderPageContent() {
  const searchParams = useSearchParams();
  const formIdParam = searchParams.get("formId");
  const formId = Number(formIdParam);

  const hasValidFormId =
    Boolean(formIdParam) &&
    Number.isInteger(formId) &&
    formId > 0;

  const {
    data: form,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => formsApi.getById(formId),
    enabled: hasValidFormId,
  });

  if (!hasValidFormId) {
    return (
      <BuilderErrorState
        title="No form selected"
        description="Open the builder from one of the form cards on your dashboard."
      />
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2b222d]" />

          <p className="mt-4 text-sm font-medium text-zinc-700">
            Loading form builder...
          </p>
        </div>
      </main>
    );
  }

  if (isError || !form) {
    return (
      <BuilderErrorState
        title="Unable to open this form"
        description={
          error instanceof Error
            ? error.message
            : "The requested form could not be found."
        }
      />
    );
  }

  return <BuilderShell initialForm={form} />;
}

interface BuilderErrorStateProps {
  title: string;
  description: string;
}

function BuilderErrorState({
  title,
  description,
}: BuilderErrorStateProps) {
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

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
          <Loader2 className="h-8 w-8 animate-spin text-[#2b222d]" />
        </main>
      }
    >
      <BuilderPageContent />
    </Suspense>
  );
}