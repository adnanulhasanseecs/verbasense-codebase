"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@verbasense.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-white">Sign in</h1>
      <p className="mt-1 text-sm text-[#9CA3AF]">Use your account email to access VerbaSense.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            const user = await login(email, password);
            router.push(user.role === "admin" ? "/admin/users" : "/dashboard");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        <label className="block text-sm text-[#E5E7EB]">
          Email
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#121826] px-3 py-2 text-sm text-white"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm text-[#E5E7EB]">
          Password
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#121826] px-3 py-2 text-sm text-white"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          className="w-full rounded-xl bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
