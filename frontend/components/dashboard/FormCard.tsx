"use client";

import Link from "next/link";
import {
  BarChart3,
  Copy,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Pencil,
  PencilLine,
  Send,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FormListItem } from "@/types/form";

interface FormCardProps {
  form: FormListItem;
  onRename: (form: FormListItem) => void;
  onDuplicate: (form: FormListItem) => void;
  onDelete: (form: FormListItem) => void;
  onTogglePublish: (form: FormListItem) => void;
}

function formatUpdatedDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function FormCard({
  form,
  onRename,
  onDuplicate,
  onDelete,
  onTogglePublish,
}: FormCardProps) {
  const isPublished = form.status === "published";

  return (
    <article className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50">
      <div className="relative flex min-h-44 flex-col justify-between bg-[#2b222d] p-6 text-white">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/25 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <Badge
            className={
              isPublished
                ? "border-0 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/15"
                : "border-0 bg-white/10 text-zinc-200 hover:bg-white/10"
            }
          >
            {isPublished ? "Published" : "Draft"}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Open actions for ${form.title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <MoreHorizontal className="h-5 w-5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-52 rounded-xl"
            >
              <DropdownMenuItem
                render={
                  <Link href={`/builder?formId=${form.id}`}>
                    <Pencil className="h-4 w-4" />
                    Edit form
                  </Link>
                }
              />

              <DropdownMenuItem
                onClick={() => onRename(form)}
              >
                <PencilLine className="h-4 w-4" />
                Rename
              </DropdownMenuItem>

              <DropdownMenuItem
                render={
                  <Link href={`/responses/${form.id}`}>
                    <BarChart3 className="h-4 w-4" />
                    View responses
                  </Link>
                }
              />

              {isPublished && (
                <DropdownMenuItem
                  render={
                    <Link
                      href={`/forms/${form.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open public form
                    </Link>
                  }
                />
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onTogglePublish(form)}
              >
                <Send className="h-4 w-4" />
                {isPublished ? "Unpublish" : "Publish"}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onDuplicate(form)}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(form)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative mt-10">
          <FileText className="mb-4 h-7 w-7 text-fuchsia-200" />

          <h2 className="line-clamp-2 text-2xl font-semibold tracking-tight">
            {form.title}
          </h2>
        </div>
      </div>

      <div className="p-6">
        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-zinc-500">
          {form.description || "No description added yet."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-50 p-3">
            <p className="text-xl font-semibold text-zinc-950">
              {form.question_count}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Questions
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-3">
            <p className="text-xl font-semibold text-zinc-950">
              {form.response_count}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Responses
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-5">
          <p className="text-xs text-zinc-400">
            Updated {formatUpdatedDate(form.updated_at)}
          </p>

          <Link
            href={`/builder?formId=${form.id}`}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            Edit
          </Link>
        </div>
      </div>
    </article>
  );
}