"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { CreateFormDialog } from "@/components/dashboard/CreateFormDialog";
import type { CreateFormValues } from "@/components/dashboard/CreateFormDialog";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FormsGrid } from "@/components/dashboard/FormsGrid";
import { RenameFormDialog } from "@/components/dashboard/RenameFormDialog";
import type { RenameFormValues } from "@/components/dashboard/RenameFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formsApi } from "@/lib/api";
import type { FormListItem } from "@/types/form";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [formToRename, setFormToRename] =
    useState<FormListItem | null>(null);

  const [formToDelete, setFormToDelete] =
    useState<FormListItem | null>(null);

  const {
    data: forms = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["forms"],
    queryFn: formsApi.getAll,
  });

  const filteredForms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return forms;
    }

    return forms.filter((form) => {
      const titleMatches = form.title
        .toLowerCase()
        .includes(query);

      const descriptionMatches = form.description
        ?.toLowerCase()
        .includes(query);

      const statusMatches = form.status
        .toLowerCase()
        .includes(query);

      return (
        titleMatches ||
        descriptionMatches ||
        statusMatches
      );
    });
  }, [forms, searchQuery]);

  const createMutation = useMutation({
    mutationFn: formsApi.create,

    onSuccess: async (createdForm) => {
      await queryClient.invalidateQueries({
        queryKey: ["forms"],
      });

      setCreateDialogOpen(false);

      toast.success("Form created successfully.");

      router.push(`/builder?formId=${createdForm.id}`);
    },

    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({
      formId,
      title,
    }: {
      formId: number;
      title: string;
    }) =>
      formsApi.update(formId, {
        title,
      }),

    onSuccess: async (updatedForm) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["forms"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["form", updatedForm.id],
        }),
      ]);

      setFormToRename(null);

      toast.success("Form renamed successfully.");
    },

    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: formsApi.duplicate,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["forms"],
      });

      toast.success("Form duplicated successfully.");
    },

    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: formsApi.delete,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["forms"],
      });

      setFormToDelete(null);

      toast.success("Form deleted successfully.");
    },

    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({
      formId,
      isPublished,
    }: {
      formId: number;
      isPublished: boolean;
    }) =>
      isPublished
        ? formsApi.unpublish(formId)
        : formsApi.publish(formId),

    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["forms"],
      });

      toast.success(
        variables.isPublished
          ? "Form unpublished."
          : "Form published successfully.",
      );
    },

    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  async function handleCreateForm(
    values: CreateFormValues,
  ) {
    await createMutation.mutateAsync({
      title: values.title,
      description: values.description || null,
      questions: [],
    });
  }

  function handleRename(form: FormListItem) {
    setFormToRename(form);
  }

  async function handleRenameSubmit(
    values: RenameFormValues,
  ) {
    if (!formToRename) {
      return;
    }

    await renameMutation.mutateAsync({
      formId: formToRename.id,
      title: values.title,
    });
  }

  function handleDuplicate(form: FormListItem) {
    duplicateMutation.mutate(form.id);
  }

  function handleDelete(form: FormListItem) {
    setFormToDelete(form);
  }

  function handleTogglePublish(form: FormListItem) {
    publishMutation.mutate({
      formId: form.id,
      isPublished: form.status === "published",
    });
  }

  function confirmDelete() {
    if (!formToDelete) {
      return;
    }

    deleteMutation.mutate(formToDelete.id);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateClick={() => setCreateDialogOpen(true)}
      />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              Your forms
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {filteredForms.length}{" "}
              {filteredForms.length === 1 ? "form" : "forms"}
            </p>
          </div>
        </div>

        {isError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <h2 className="text-lg font-semibold text-red-900">
              Unable to load forms
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "Please make sure the backend server is running."}
            </p>
          </div>
        ) : (
          <FormsGrid
            forms={filteredForms}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onCreateClick={() => setCreateDialogOpen(true)}
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
          />
        )}
      </section>

      <CreateFormDialog
        open={createDialogOpen}
        isSubmitting={createMutation.isPending}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateForm}
      />

      <RenameFormDialog
        open={Boolean(formToRename)}
        currentTitle={formToRename?.title ?? ""}
        isSubmitting={renameMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setFormToRename(null);
          }
        }}
        onSubmit={handleRenameSubmit}
      />

      <AlertDialog
        open={Boolean(formToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setFormToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete this form?
            </AlertDialogTitle>

            <AlertDialogDescription>
              {formToDelete
                ? `“${formToDelete.title}” and all of its questions, responses, and answers will be permanently deleted.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending
                ? "Deleting..."
                : "Delete form"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}