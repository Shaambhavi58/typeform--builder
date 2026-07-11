"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { SortableQuestionItem } from "@/components/builder/SortableQuestionItem";
import type { Question } from "@/types/form";

interface QuestionSidebarProps {
  questions: Question[];
  selectedQuestionId: number | null;
  isReordering: boolean;
  onSelectQuestion: (questionId: number) => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (question: Question) => void;
  onDuplicateQuestion: (question: Question) => void;
  onReorderQuestions: (
    activeQuestionId: number,
    overQuestionId: number,
  ) => void;
}

export function QuestionSidebar({
  questions,
  selectedQuestionId,
  isReordering,
  onSelectQuestion,
  onAddQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onReorderQuestions,
}: QuestionSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    onReorderQuestions(
      Number(active.id),
      Number(over.id),
    );
  }

  return (
    <aside className="flex min-h-0 w-80 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">
              Questions
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {isReordering
                ? "Saving order..."
                : `${questions.length} ${
                    questions.length === 1
                      ? "question"
                      : "questions"
                  }`}
            </p>
          </div>

          <button
            type="button"
            onClick={onAddQuestion}
            aria-label="Add question"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2b222d] text-white transition hover:bg-[#3a2c3d]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center">
            <p className="text-sm font-medium text-zinc-800">
              No questions yet
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Add your first question to start building the form.
            </p>

            <button
              type="button"
              onClick={onAddQuestion}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2b222d] px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Add question
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(
                (question) => question.id,
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    index={index}
                    isSelected={
                      selectedQuestionId === question.id
                    }
                    onSelect={onSelectQuestion}
                    onDelete={onDeleteQuestion}
                    onDuplicate={onDuplicateQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </aside>
  );
}