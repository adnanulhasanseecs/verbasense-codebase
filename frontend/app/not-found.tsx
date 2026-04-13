import Link from "next/link";

/** App Router 404 — avoids client navigation crashing on unknown paths (Next 16 RSC fetch edge cases). */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">VerbaSense · CourtSense</p>
      <h1 className="mt-3 text-3xl font-semibold text-[#F9FAFB]">Page not found</h1>
      <p className="mt-2 text-sm text-[#9CA3AF]">That route does not exist in this demo build.</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back to sign in
      </Link>
    </div>
  );
}
