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

const renameFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must contain at least 2 characters.")
    .max(100, "Title cannot exceed 100 characters."),
});

export type RenameFormValues = z.infer<typeof renameFormSchema>;

interface RenameFormDialogProps {
  open: boolean;
  currentTitle: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RenameFormValues) => Promise<void>;
}

export function RenameFormDialog({
  open,
  currentTitle,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: RenameFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RenameFormValues>({
    resolver: zodResolver(renameFormSchema),
    defaultValues: {
      title: currentTitle,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: currentTitle,
      });
    }
  }, [open, currentTitle, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Rename form
          </DialogTitle>

          <DialogDescription>
            Update the title shown on your dashboard and builder.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label
              htmlFor="rename-title"
              className="text-sm font-medium text-zinc-900"
            >
              Form title
            </label>

            <Input
              id="rename-title"
              autoFocus
              className="h-11 rounded-xl"
              {...register("title")}
            />

            {errors.title && (
              <p className="text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
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
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}