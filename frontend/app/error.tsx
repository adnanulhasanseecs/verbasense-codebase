"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Catches client-side errors (including failed RSC fetches during soft navigation).
 * Offers recovery without a full browser restart.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isFetch =
    error?.message?.includes("fetch") || error?.name === "TypeError";

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">Something went wrong</p>
      <h1 className="mt-3 text-2xl font-semibold text-[#F9FAFB]">
        {isFetch ? "Could not load this page" : "Unexpected error"}
      </h1>
      <p className="mt-2 text-sm text-[#9CA3AF]">
        {isFetch
          ? "The dev server may have restarted or the connection dropped. Try again, or use a full reload."
          : (error.message ?? "Please try again.")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl border border-white/[0.12] bg-[#121826] px-5 py-2.5 text-sm font-semibold text-[#E5E7EB] hover:bg-white/[0.06]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
