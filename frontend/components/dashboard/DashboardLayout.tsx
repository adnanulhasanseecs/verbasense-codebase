"use client";

import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Gavel, Scale } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { memo } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRole } from "@/components/rbac/RoleContext";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";

const kpis = [
  {
    title: "Active Sessions",
    value: "12",
    trend: "+12%",
    up: true,
    icon: Activity,
    data: [5, 6, 5, 7, 8, 7, 9, 10, 12],
  },
  {
    title: "Sessions Today",
    value: "38",
    trend: "+7.4%",
    up: true,
    icon: Scale,
    data: [20, 23, 25, 26, 29, 31, 34, 36, 38],
  },
  {
    title: "Documents Processed",
    value: "214",
    trend: "+4.1%",
    up: true,
    icon: CheckCircle2,
    data: [130, 132, 140, 155, 169, 180, 192, 205, 214],
  },
  {
    title: "Pending Actions",
    value: "19",
    trend: "-3.2%",
    up: false,
    icon: AlertTriangle,
    data: [30, 28, 27, 25, 24, 23, 22, 20, 19],
  },
] as const;

export function DashboardLayout() {
  const { role } = useRole();
  const { data, isLoading, isError, refetch } = useDashboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-12 gap-6 p-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="col-span-12 h-40 animate-pulse rounded-2xl bg-[#121826]/80 ring-1 ring-white/[0.06] lg:col-span-6" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-100">
        Failed to load dashboard analytics.
        <button type="button" onClick={() => refetch()} className="ml-3 rounded-lg border border-white/20 px-2 py-1 text-xs hover:bg-white/10">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="rounded-2xl border border-white/10 bg-[#121826] p-4 text-sm text-[#9CA3AF]">No dashboard data available.</div>;
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="grid grid-cols-12 gap-6 p-6">
        <section className="vs-card-glow col-span-12 w-full rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0F172A] via-[#111A2D] to-[#0B0F19] p-6 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">CourtSense Command Center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#F9FAFB]">
            Operational Dashboard
          </h1>
        </section>

        {data.kpis.map((kpi, index) => (
          <div key={kpi.title} className="col-span-12 min-w-0 md:col-span-6 lg:col-span-3">
            <KPICardWithTrend mounted={mounted} icon={kpis[index]?.icon ?? Activity} {...kpi} />
          </div>
        ))}

        <div className="col-span-12 min-w-0 lg:col-span-8">
          <LiveSessionPanel liveSession={data.liveSession} />
        </div>
        <div className="col-span-12 min-w-0 lg:col-span-4">
          <ActivityChart mounted={mounted} sessionsPerHour={data.sessionsPerHour} />
        </div>

        <div className="col-span-12 min-w-0 lg:col-span-8">
          <SessionsAnalyticsChart mounted={mounted} byCourtroom={data.byCourtroom} byDay={data.byDay} />
        </div>
        <div className="col-span-12 min-w-0 lg:col-span-4">
          <IntelligencePanel role={role} summary={data.intelligence.summary} decisions={data.intelligence.decisions.map((d) => d.text)} actions={data.intelligence.actions.map((a) => a.text)} />
        </div>

        <div className="col-span-12 min-w-0 lg:col-span-6">
          <DocumentsPieChart mounted={mounted} docTypes={data.docTypes} />
        </div>
        <div className="col-span-12 min-w-0 lg:col-span-6">
          <ActionsTimeline timeline={data.timeline} />
        </div>
      </div>
    </div>
  );
}

const panelSurface =
  "vs-card-glow rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#16213A] via-[#111B30] to-[#0B0F19] p-5 backdrop-blur-md";

function useElementSize(minWidth = 120, minHeight = 80) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: minWidth, height: minHeight });

  useEffect(() => {
    if (!ref.current) return;
    let raf = 0;

    const measure = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const nextWidth = Math.max(minWidth, Math.floor(rect.width || 0));
      const nextHeight = Math.max(minHeight, Math.floor(rect.height || 0));
      setSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight },
      );
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    scheduleMeasure();
    window.addEventListener("resize", scheduleMeasure);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleMeasure);
      observer.observe(ref.current);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", scheduleMeasure);
      observer?.disconnect();
    };
  }, [minWidth, minHeight]);

  return { ref, size };
}

function KPICardWithTrend({
  title,
  value,
  trend,
  up,
  href,
  icon: Icon,
  data,
  mounted,
}: {
  title: string;
  value: string;
  trend: string;
  up: boolean;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  data: readonly number[];
  mounted: boolean;
}) {
  const chartData = data.map((v, i) => ({ x: i, y: v }));

  return (
    <Link href={href} className={`${panelSurface} block transition hover:border-white/25 hover:bg-[#162743]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-[#F9FAFB]">{value}</p>
        </div>
        <span className="rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/12 p-2.5 text-[#67E8F9] shadow-[0_0_24px_rgba(34,211,238,0.24)]">
          <Icon size={17} />
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-sm font-semibold ${up ? "text-emerald-300" : "text-rose-300"}`}>
          {up ? "▲" : "▼"} {trend}
        </span>
        <MiniSparkline data={chartData} color={up ? "#67E8F9" : "#FB7185"} mounted={mounted} />
      </div>
    </Link>
  );
}

function MiniSparkline({
  data,
  color,
  mounted,
}: {
  data: { x: number; y: number }[];
  color: string;
  mounted: boolean;
}) {
  const { ref, size } = useElementSize(90, 56);
  return (
    <div ref={ref} className="h-14 w-28 min-w-0">
      {mounted ? (
        <LineChart width={size.width} height={size.height} data={data}>
          <Line type="monotone" dataKey="y" stroke={color} strokeWidth={3} dot={false} />
        </LineChart>
      ) : (
        <div className="h-full w-full rounded bg-[#0B0F19]/70" />
      )}
    </div>
  );
}

function LiveSessionPanel({
  liveSession,
}: {
  liveSession: {
    courtroom: string;
    speaker: string;
    durationLabel: string;
    timelineProgress: number;
    speakerActivity: Array<{ label: string; value: number }>;
    waveform: number[];
  } | null;
}) {
  if (!liveSession) {
    return <section className={`${panelSurface} flex min-h-[340px] w-full items-center justify-center`}>No live session</section>;
  }
  return (
    <section
      className={`${panelSurface} flex min-h-[340px] w-full flex-col overflow-hidden lg:h-full`}
    >
      <div className="flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Live Session</h3>
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/35 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.35)]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-400" /> LIVE
        </span>
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div>
          <p className="text-sm text-[#E5E7EB]">{liveSession.courtroom} · Speaker: {liveSession.speaker}</p>
          <div className="mt-3 flex h-24 items-end gap-1 rounded-xl border border-white/[0.08] bg-[#0B0F19]/78 px-3 py-2">
            {liveSession.waveform.map((value, i) => (
              <span
                key={i}
                className="w-1 rounded bg-[#60A5FA]"
                style={{ height: `${value}%`, opacity: 0.4 + ((i % 5) * 0.12) }}
              />
            ))}
          </div>
          <div className="mt-3">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-[#9CA3AF]">Session timeline</p>
            <div className="h-3 rounded-full bg-[#0B0F19]">
              <div className="h-3 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#6366F1]" style={{ width: `${Math.round(liveSession.timelineProgress * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-[#9CA3AF]">Duration: {liveSession.durationLabel}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/78 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">Speaker activity</p>
          <ul className="mt-2 space-y-2 text-xs">
            {liveSession.speakerActivity.map((entry) => (
              <li key={entry.label} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#111827] px-2 py-1.5"><span>{entry.label}</span><span className="text-[#22D3EE]">{entry.value}%</span></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="min-h-0 flex-1" aria-hidden />
    </section>
  );
}

const ActivityChart = memo(function ActivityChart({
  mounted,
  sessionsPerHour,
}: {
  mounted: boolean;
  sessionsPerHour: Array<{ hour: string; sessions: number }>;
}) {
  return (
    <section className={`${panelSurface} flex min-h-[340px] w-full flex-col lg:h-full`}>
      <h3 className="shrink-0 text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
        Sessions Per Hour
      </h3>
      <MeasuredChartBlock mounted={mounted} className="mt-3 h-48 w-full min-w-0 shrink-0" minWidth={260} minHeight={180}>
        {(w, h) => (
          <BarChart width={w} height={h} data={sessionsPerHour}>
            <XAxis dataKey="hour" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="sessions" fill="#60A5FA" barSize={24} radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </MeasuredChartBlock>
      <div className="min-h-0 flex-1" aria-hidden />
    </section>
  );
});

const SessionsAnalyticsChart = memo(function SessionsAnalyticsChart({
  mounted,
  byCourtroom,
  byDay,
}: {
  mounted: boolean;
  byCourtroom: Array<{ name: string; value: number }>;
  byDay: Array<{ day: string; value: number }>;
}) {
  return (
    <section className={`${panelSurface} flex min-h-[360px] w-full flex-col lg:h-full`}>
      <h3 className="shrink-0 text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
        Sessions Analytics
      </h3>
      <div className="mt-3 grid shrink-0 gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs text-[#9CA3AF]">Sessions by courtroom</p>
          <MeasuredChartBlock mounted={mounted} className="mt-2 h-48 w-full min-w-0" minWidth={240} minHeight={160}>
            {(w, h) => (
              <BarChart width={w} height={h} data={byCourtroom}>
                <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" fill="#818CF8" barSize={26} radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </MeasuredChartBlock>
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF]">Sessions by day</p>
          <MeasuredChartBlock mounted={mounted} className="mt-2 h-48 w-full min-w-0" minWidth={240} minHeight={160}>
            {(w, h) => (
              <AreaChart width={w} height={h} data={byDay}>
                <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="value" stroke="#22D3EE" fill="#22D3EE66" strokeWidth={3} />
              </AreaChart>
            )}
          </MeasuredChartBlock>
        </div>
      </div>
      <div className="min-h-0 flex-1" aria-hidden />
    </section>
  );
});

function IntelligencePanel({
  role,
  summary,
  decisions,
  actions,
}: {
  role: string;
  summary: string;
  decisions: string[];
  actions: string[];
}) {
  return (
    <section className={`${panelSurface} flex min-h-[360px] w-full flex-col lg:h-full`}>
      <h3 className="shrink-0 text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
        Intelligence Snapshot
      </h3>
      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto">
        <div className="rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 p-3">
          <p className="text-base text-[#E5E7EB]">{summary || `Role-aware summary stream for ${role} operations.`}</p>
        </div>
        <ul className="space-y-2 text-sm text-[#E5E7EB]">
          {decisions.map((d) => (
            <li key={d} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2">
              <Gavel size={14} className="text-[#22D3EE]" /> {d}
            </li>
          ))}
        </ul>
        <ul className="space-y-2 text-sm text-[#E5E7EB]">
          {actions.map((a) => (
            <li key={a} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2">
              <Clock3 size={14} className="text-[#F59E0B]" /> {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const DocumentsPieChart = memo(function DocumentsPieChart({
  mounted,
  docTypes,
}: {
  mounted: boolean;
  docTypes: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <section className={`${panelSurface} flex min-h-[340px] w-full flex-col lg:h-full`}>
      <h3 className="shrink-0 text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
        Document Distribution
      </h3>
      <div className="mt-3 grid shrink-0 gap-4 lg:grid-cols-[1fr_220px]">
        <MeasuredChartBlock mounted={mounted} className="h-48 w-full min-w-0" minWidth={260} minHeight={180}>
          {(w, h) => (
            <PieChart width={w} height={h}>
              <Pie data={docTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={96} innerRadius={48}>
                {docTypes.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </MeasuredChartBlock>
        <ul className="space-y-3 text-sm">
          {docTypes.map((d) => (
            <li key={d.name} className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-2">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</span>
              <span className="text-[#9CA3AF]">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-h-0 flex-1" aria-hidden />
    </section>
  );
});

function MeasuredChartBlock({
  mounted,
  className,
  children,
  minWidth = 220,
  minHeight = 140,
}: {
  mounted: boolean;
  className: string;
  children: (width: number, height: number) => ReactNode;
  minWidth?: number;
  minHeight?: number;
}) {
  const { ref, size } = useElementSize(minWidth, minHeight);

  return (
    <div ref={ref} className={className}>
      {mounted ? (
        children(size.width, size.height)
      ) : (
        <div className="h-full w-full rounded-xl bg-[#0B0F19]/70" />
      )}
    </div>
  );
}

function ActionsTimeline({
  timeline,
}: {
  timeline: Array<{ title: string; detail: string; at: string }>;
}) {
  return (
    <section className={`${panelSurface} flex min-h-[340px] w-full flex-col lg:h-full`}>
      <h3 className="shrink-0 text-sm font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
        Pending Actions Timeline
      </h3>
      <ol className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto">
        {timeline.map((t, i) => (
          <li key={t.title} className="relative rounded-xl border border-white/[0.08] bg-[#0B0F19]/70 px-3 py-3 pl-10">
            <span className="absolute left-3 top-3.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#3B82F6]/25 text-[10px] text-[#93C5FD]">{i + 1}</span>
            <p className="text-sm font-medium text-[#E5E7EB]">{t.title}</p>
            <p className="text-xs text-[#9CA3AF]">{t.detail}</p>
            <p className="mt-1 text-[11px] text-[#6B7280]">{t.at}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
