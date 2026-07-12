"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { BuilderHeader } from "@/components/builder/BuilderHeader";
import { LivePreview } from "@/components/builder/LivePreview";
import { QuestionEditor } from "@/components/builder/QuestionEditor";
import { QuestionSidebar } from "@/components/builder/QuestionSidebar";
import {
  formsApi,
  questionsApi,
} from "@/lib/api";
import type {
  Form,
  Question,
  QuestionOption,
  QuestionType,
  UpdateQuestionPayload,
} from "@/types/form";

interface BuilderShellProps {
  initialForm: Form;
}

const DEFAULT_QUESTION_TITLE =
  "Write your question here";

function isChoiceQuestion(type?: QuestionType) {
  return (
    type === "multiple_choice" ||
    type === "dropdown"
  );
}

function normalizeOptions(
  options: QuestionOption[],
) {
  return options.map((option, index) => ({
    ...option,
    position: index,
  }));
}

export function BuilderShell({
  initialForm,
}: BuilderShellProps) {
  const queryClient = useQueryClient();

  const [form, setForm] =
    useState<Form>(initialForm);

  const [selectedQuestionId, setSelectedQuestionId] =
    useState<number | null>(
      initialForm.questions[0]?.id ?? null,
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const pendingSaveTimers = useRef<
    Record<number, ReturnType<typeof setTimeout>>
  >({});

  const pendingQuestionUpdates = useRef<
    Record<number, Partial<Question>>
  >({});

  useEffect(() => {
    const timers = pendingSaveTimers.current;

    return () => {
      Object.values(timers).forEach(
        clearTimeout,
      );
    };
  }, []);

  const orderedQuestions = useMemo(
    () =>
      [...form.questions].sort(
        (first, second) =>
          first.position - second.position,
      ),
    [form.questions],
  );

  const selectedQuestion =
    orderedQuestions.find(
      (question) =>
        question.id === selectedQuestionId,
    ) ?? null;

  const selectedQuestionIndex =
    selectedQuestion
      ? orderedQuestions.findIndex(
          (question) =>
            question.id ===
            selectedQuestion.id,
        )
      : -1;

  const addQuestionMutation = useMutation({
    mutationFn: () =>
      questionsApi.create(form.id, {
        type: "short_text",
        title: DEFAULT_QUESTION_TITLE,
        description: null,
        required: false,
        position: orderedQuestions.length,
        options: [],
      }),

    onSuccess: async (createdQuestion) => {
      setForm((currentForm) => ({
        ...currentForm,
        questions: [
          ...currentForm.questions,
          createdQuestion,
        ],
      }));

      setSelectedQuestionId(
        createdQuestion.id,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["form", form.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["forms"],
        }),
      ]);

      toast.success("Question added.");
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const duplicateQuestionMutation =
    useMutation({
      mutationFn: (questionId: number) =>
        questionsApi.duplicate(
          form.id,
          questionId,
        ),

      onSuccess: async (
        duplicatedQuestion,
      ) => {
        setForm((currentForm) => ({
          ...currentForm,
          questions: [
            ...currentForm.questions,
            duplicatedQuestion,
          ],
        }));

        setSelectedQuestionId(
          duplicatedQuestion.id,
        );

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["form", form.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["forms"],
          }),
        ]);

        toast.success(
          "Question duplicated.",
        );
      },

      onError: (error: Error) => {
        toast.error(error.message);
      },
    });

  const deleteQuestionMutation =
    useMutation({
      mutationFn: (questionId: number) =>
        questionsApi.delete(
          form.id,
          questionId,
        ),

      onSuccess: async (
        _,
        deletedQuestionId,
      ) => {
        const remainingQuestions =
          orderedQuestions.filter(
            (question) =>
              question.id !==
              deletedQuestionId,
          );

        setForm((currentForm) => ({
          ...currentForm,
          questions:
            currentForm.questions.filter(
              (question) =>
                question.id !==
                deletedQuestionId,
            ),
        }));

        if (
          selectedQuestionId ===
          deletedQuestionId
        ) {
          setSelectedQuestionId(
            remainingQuestions[0]?.id ??
              null,
          );
        }

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["form", form.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["forms"],
          }),
        ]);

        toast.success("Question deleted.");
      },

      onError: (error: Error) => {
        toast.error(error.message);
      },
    });

  const reorderQuestionsMutation =
    useMutation({
      mutationFn: (
        reorderedQuestions: Question[],
      ) =>
        questionsApi.reorder(form.id, {
          questions:
            reorderedQuestions.map(
              (question, index) => ({
                question_id: question.id,
                position: index,
              }),
            ),
        }),

      onSuccess: async (
        savedQuestions,
      ) => {
        setForm((currentForm) => ({
          ...currentForm,
          questions: savedQuestions,
        }));

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["form", form.id],
          }),
          queryClient.invalidateQueries({
            queryKey: ["forms"],
          }),
        ]);

        toast.success(
          "Question order updated.",
        );
      },

      onError: async (error: Error) => {
        toast.error(error.message);

        await queryClient.invalidateQueries({
          queryKey: ["form", form.id],
        });
      },
    });

  const publishMutation = useMutation({
    mutationFn: () =>
      form.status === "published"
        ? formsApi.unpublish(form.id)
        : formsApi.publish(form.id),

    onSuccess: async () => {
      const nextStatus =
        form.status === "published"
          ? "draft"
          : "published";

      setForm((currentForm) => ({
        ...currentForm,
        status: nextStatus,
      }));

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["form", form.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["forms"],
        }),
      ]);

      toast.success(
        nextStatus === "published"
          ? "Form published successfully."
          : "Form unpublished.",
      );
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function buildUpdatePayload(
    updates: Partial<Question>,
  ): UpdateQuestionPayload | null {
    const payload: UpdateQuestionPayload =
      {};

    if (updates.type !== undefined) {
      payload.type = updates.type;
    }

    if (updates.title !== undefined) {
      const trimmedTitle =
        updates.title.trim();

      if (!trimmedTitle) {
        return null;
      }

      payload.title = updates.title;
    }

    if (
      updates.description !== undefined
    ) {
      payload.description =
        updates.description;
    }

    if (updates.required !== undefined) {
      payload.required =
        updates.required;
    }

    if (updates.position !== undefined) {
      payload.position =
        updates.position;
    }

    if (updates.options !== undefined) {
      const normalizedOptions =
        normalizeOptions(
          updates.options,
        ).map((option, index) => ({
          label: option.label.trim(),
          position: index,
        }));

      const hasBlankOption =
        normalizedOptions.some(
          (option) =>
            option.label.length === 0,
        );

      if (hasBlankOption) {
        return null;
      }

      const effectiveType =
        updates.type ??
        selectedQuestion?.type;

      if (
        isChoiceQuestion(effectiveType) &&
        normalizedOptions.length < 2
      ) {
        return null;
      }

      payload.options =
        normalizedOptions;
    }

    if (
      isChoiceQuestion(updates.type) &&
      payload.options === undefined
    ) {
      payload.options = [
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

    return payload;
  }

  function scheduleQuestionSave(
    questionId: number,
    updates: Partial<Question>,
  ) {
    const currentPendingUpdates =
      pendingQuestionUpdates.current[
        questionId
      ] ?? {};

    pendingQuestionUpdates.current[
      questionId
    ] = {
      ...currentPendingUpdates,
      ...updates,
    };

    const existingTimer =
      pendingSaveTimers.current[
        questionId
      ];

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    setIsSaving(true);

    pendingSaveTimers.current[
      questionId
    ] = setTimeout(async () => {
      const mergedUpdates =
        pendingQuestionUpdates.current[
          questionId
        ] ?? {};

      const payload =
        buildUpdatePayload(
          mergedUpdates,
        );

      if (!payload) {
        delete pendingSaveTimers.current[
          questionId
        ];

        if (
          Object.keys(
            pendingSaveTimers.current,
          ).length === 0
        ) {
          setIsSaving(false);
        }

        return;
      }

      try {
        const savedQuestion =
          await questionsApi.update(
            form.id,
            questionId,
            payload,
          );

        setForm((currentForm) => ({
          ...currentForm,
          questions:
            currentForm.questions.map(
              (question) =>
                question.id ===
                questionId
                  ? savedQuestion
                  : question,
            ),
        }));

        delete pendingQuestionUpdates
          .current[questionId];

        await queryClient.invalidateQueries({
          queryKey: [
            "form",
            form.id,
          ],
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to save the question.",
        );
      } finally {
        delete pendingSaveTimers.current[
          questionId
        ];

        if (
          Object.keys(
            pendingSaveTimers.current,
          ).length === 0
        ) {
          setIsSaving(false);
        }
      }
    }, 650);
  }

  function handleQuestionChange(
    questionId: number,
    updates: Partial<Question>,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      questions:
        currentForm.questions.map(
          (question) =>
            question.id === questionId
              ? {
                  ...question,
                  ...updates,
                  options:
                    updates.options !==
                    undefined
                      ? normalizeOptions(
                          updates.options,
                        )
                      : question.options,
                }
              : question,
        ),
    }));

    scheduleQuestionSave(
      questionId,
      updates,
    );
  }

  function handleDeleteQuestion(
    question: Question,
  ) {
    const shouldDelete =
      window.confirm(
        `Delete “${question.title}”?`,
      );

    if (!shouldDelete) {
      return;
    }

    deleteQuestionMutation.mutate(
      question.id,
    );
  }

  function handleDuplicateQuestion(
    question: Question,
  ) {
    duplicateQuestionMutation.mutate(
      question.id,
    );
  }

  function handleReorderQuestions(
    activeQuestionId: number,
    overQuestionId: number,
  ) {
    const oldIndex =
      orderedQuestions.findIndex(
        (question) =>
          question.id ===
          activeQuestionId,
      );

    const newIndex =
      orderedQuestions.findIndex(
        (question) =>
          question.id ===
          overQuestionId,
      );

    if (
      oldIndex === -1 ||
      newIndex === -1 ||
      oldIndex === newIndex
    ) {
      return;
    }

    const reorderedQuestions =
      arrayMove(
        orderedQuestions,
        oldIndex,
        newIndex,
      ).map((question, index) => ({
        ...question,
        position: index,
      }));

    setForm((currentForm) => ({
      ...currentForm,
      questions:
        reorderedQuestions,
    }));

    reorderQuestionsMutation.mutate(
      reorderedQuestions,
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f7f7f5]">
      <BuilderHeader
        form={form}
        isSaving={isSaving}
        isPublishing={
          publishMutation.isPending
        }
        onPublishToggle={() =>
          publishMutation.mutate()
        }
      />

      <div className="flex min-h-0 flex-1">
        <QuestionSidebar
          questions={orderedQuestions}
          selectedQuestionId={
            selectedQuestionId
          }
          isReordering={
            reorderQuestionsMutation.isPending
          }
          onSelectQuestion={
            setSelectedQuestionId
          }
          onAddQuestion={() =>
            addQuestionMutation.mutate()
          }
          onDeleteQuestion={
            handleDeleteQuestion
          }
          onDuplicateQuestion={
            handleDuplicateQuestion
          }
          onReorderQuestions={
            handleReorderQuestions
          }
        />

        <QuestionEditor
          question={selectedQuestion}
          onChange={
            handleQuestionChange
          }
        />

        <LivePreview
          question={selectedQuestion}
          questionNumber={
            selectedQuestionIndex >= 0
              ? selectedQuestionIndex + 1
              : 0
          }
          totalQuestions={
            orderedQuestions.length
          }
        />
      </div>
    </div>
  );
}