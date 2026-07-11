"use client";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

export function DashboardHeader({
  searchQuery,
  onSearchChange,
  onCreateClick,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            My workspace
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Forms
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Create, publish, and manage your conversational forms.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

            <Input
              value={searchQuery}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="Search forms"
              className="h-11 rounded-xl border-zinc-200 bg-zinc-50 pl-10 shadow-none focus-visible:ring-zinc-400"
            />
          </div>

          <Button
            type="button"
            onClick={onCreateClick}
            className="h-11 rounded-xl bg-[#2b222d] px-5 text-white hover:bg-[#3a2c3d]"
          >
            <Plus className="h-4 w-4" />
            Create form
          </Button>
        </div>
      </div>
    </header>
  );
}