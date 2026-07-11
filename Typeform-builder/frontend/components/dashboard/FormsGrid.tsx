"use client";

import { FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FormListItem } from "@/types/form";

import { FormCard } from "./FormCard";

interface FormsGridProps {
  forms: FormListItem[];
  isLoading: boolean;
  searchQuery: string;
  onCreateClick: () => void;
  onRename: (form: FormListItem) => void;
  onDuplicate: (form: FormListItem) => void;
  onDelete: (form: FormListItem) => void;
  onTogglePublish: (form: FormListItem) => void;
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-zinc-200 bg-white"
        >
          <Skeleton className="h-44 w-full rounded-none" />

          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-16 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormsGrid({
  forms,
  isLoading,
  searchQuery,
  onCreateClick,
  onRename,
  onDuplicate,
  onDelete,
  onTogglePublish,
}: FormsGridProps) {
  if (isLoading) {
    return <LoadingGrid />;
  }

  if (forms.length === 0) {
    const hasSearch = searchQuery.trim().length > 0;

    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2b222d] text-white">
          <FilePlus2 className="h-7 w-7" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950">
          {hasSearch ? "No forms found" : "Create your first form"}
        </h2>

        <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
          {hasSearch
            ? `No forms match “${searchQuery}”. Try another search term.`
            : "Build a conversational form, publish it, and start collecting responses in minutes."}
        </p>

        {!hasSearch && (
          <Button
            type="button"
            onClick={onCreateClick}
            className="mt-6 h-11 rounded-xl bg-[#2b222d] px-5 text-white hover:bg-[#3a2c3d]"
          >
            <FilePlus2 className="h-4 w-4" />
            Create form
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {forms.map((form) => (
        <FormCard
          key={form.id}
          form={form}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onTogglePublish={onTogglePublish}
        />
      ))}
    </div>
  );
}