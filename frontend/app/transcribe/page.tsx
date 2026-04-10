import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/rbac/RoleGuard";
import { UploadPanel } from "@/components/UploadPanel";

export default function TranscribePage() {
  return (
    <AppShell>
      <RoleGuard
        roles={["admin", "clerk"]}
        fallback={
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Your role does not have access to Transcribe.
          </p>
        }
      >
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#121826]/90 p-8 shadow-[0_24px_80px_-36px_rgba(245,158,11,0.38)] ring-1 ring-white/[0.04]">
            <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-[#6366F1]/15 blur-[70px]" />
            <div className="relative space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#22D3EE]/90">Transcribe</p>
              <h1 className="text-3xl font-bold tracking-tight text-[#F9FAFB]">Transcribe audio</h1>
              <p className="text-sm leading-relaxed text-[#9CA3AF]">
                Drop a <strong className="font-medium text-[#E5E7EB]">WAV</strong> or{" "}
                <strong className="font-medium text-[#E5E7EB]">MP3</strong>. Optional metadata is sent
                as JSON to the API (`case_id`, `courtroom`).
              </p>
            </div>
          </div>
          <UploadPanel />
        </div>
      </RoleGuard>
    </AppShell>
  );
}

