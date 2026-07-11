"use client";

import { CSS } from "@dnd-kit/utilities";
import {
  useSortable,
} from "@dnd-kit/sortable";
import {
  Copy,
  GripVertical,
  Trash2,
} from "lucide-react";

import type { Question } from "@/types/form";

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: (questionId: number) => void;
  onDelete: (question: Question) => void;
  onDuplicate: (question: Question) => void;
}

export function SortableQuestionItem({
  question,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-start gap-2 rounded-2xl border p-3 transition ${
        isSelected
          ? "border-[#2b222d] bg-[#f3eef4]"
          : "border-transparent bg-white hover:bg-zinc-100"
      } ${
        isDragging
          ? "z-50 scale-[1.02] shadow-xl opacity-90"
          : ""
      }`}
    >
      <button
        type="button"
        aria-label={`Drag question ${index + 1}`}
        className="mt-0.5 inline-flex h-7 w-6 shrink-0 cursor-grab items-center justify-center rounded-lg text-zinc-400 hover:bg-white hover:text-zinc-700 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => onSelect(question.id)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="text-xs font-medium capitalize text-zinc-500">
          {index + 1} · {question.type.replaceAll("_", " ")}
        </p>

        <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-zinc-950">
          {question.title || "Untitled question"}
        </p>
      </button>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Duplicate ${question.title}`}
          onClick={() => onDuplicate(question)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white hover:text-zinc-950"
        >
          <Copy className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label={`Delete ${question.title}`}
          onClick={() => onDelete(question)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}