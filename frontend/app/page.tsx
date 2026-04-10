import { AppShell } from "@/components/AppShell";
import { DemoCredentials } from "@/components/DemoCredentials";

export default function SignInPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <section className="rounded-2xl border border-white/[0.08] bg-[#121826]/85 p-8 shadow-[0_18px_52px_-26px_rgba(245,158,11,0.4)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#22D3EE]">VerbaSense · CourtSense</p>
          <h1 className="mt-2 text-3xl font-bold text-[#F9FAFB]">Sign in</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Use a demo role card to access role-specific dashboard experiences.
          </p>
        </section>
        <DemoCredentials />
      </div>
    </AppShell>
  );
}

