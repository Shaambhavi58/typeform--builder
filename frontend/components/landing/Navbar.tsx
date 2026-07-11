import Link from "next/link";

export function Navbar() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="h-5 w-2 rounded-full bg-white" />
          <span className="h-5 w-5 rounded-md bg-white" />
        </span>

        <span className="text-xl font-semibold tracking-tight">
          FormFlow
        </span>
      </Link>

      <Link
        href="/dashboard"
        className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-[#2b222d] transition hover:scale-[1.02] hover:bg-zinc-100"
      >
        Open workspace
      </Link>
    </header>
  );
}