"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const createFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must contain at least 2 characters.")
    .max(100, "Title cannot exceed 100 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional(),
});

export type CreateFormValues = z.infer<typeof createFormSchema>;

interface CreateFormDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateFormValues) => Promise<void>;
}

export function CreateFormDialog({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: CreateFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  async function submitForm(values: CreateFormValues) {
    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Create a new form
          </DialogTitle>

          <DialogDescription>
            Start with a title and description. Questions can be added
            inside the builder.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submitForm)}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-zinc-900"
            >
              Form title
            </label>

            <Input
              id="title"
              autoFocus
              placeholder="Customer feedback"
              className="h-11 rounded-xl"
              {...register("title")}
            />

            {errors.title && (
              <p className="text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-900"
            >
              Description
            </label>

            <Textarea
              id="description"
              placeholder="Tell respondents what this form is about."
              className="min-h-28 resize-none rounded-xl"
              {...register("description")}
            />

            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#2b222d] text-white hover:bg-[#3a2c3d]"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              Create form
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}