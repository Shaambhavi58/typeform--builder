"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Send,
} from "lucide-react";

import type { Form } from "@/types/form";

interface BuilderHeaderProps {
  form: Form;
  isSaving: boolean;
  isPublishing: boolean;
  onPublishToggle: () => void;
}

export function BuilderHeader({
  form,
  isSaving,
  isPublishing,
  onPublishToggle,
}: BuilderHeaderProps) {
  const isPublished = form.status === "published";

  return (
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

          <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              "All changes saved"
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isPublished && (
          <Link
            href={`/forms/${form.slug}`}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </Link>
        )}

        <button
          type="button"
          disabled={isPublishing}
          onClick={onPublishToggle}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#2b222d] px-4 text-sm font-medium text-white transition hover:bg-[#3a2c3d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPublishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}

          {isPublished ? "Unpublish" : "Publish"}
        </button>
      </div>
    </header>
  );
}