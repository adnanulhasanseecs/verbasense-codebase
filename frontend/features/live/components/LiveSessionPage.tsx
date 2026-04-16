"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, Pause, Play, Settings2, Square, Timer } from "lucide-react";
import {
  applySpeakerLabels,
  pauseLiveSession,
  resumeLiveSession,
  sendLiveChunk,
  startLiveSession,
  stopLiveSession,
} from "@/lib/api/live";
import { useAppStore } from "@/store/app-store";

type WaveState = number[];

export function LiveSessionPage() {
  const liveSession = useAppStore((state) => state.liveSession);
  const setLiveSession = useAppStore((state) => state.setLiveSession);

  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [courtroom, setCourtroom] = useState("Courtroom A");
  const [sampleRate, setSampleRate] = useState(16000);
  const [chunkMs, setChunkMs] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [speakerDrafts, setSpeakerDrafts] = useState<Record<string, string>>({});
  const [busyAction, setBusyAction] = useState<"play" | "pause" | "stop" | null>(null);
  const [labelSaved, setLabelSaved] = useState(false);
  const [waveBars, setWaveBars] = useState<WaveState>(
    Array.from({ length: 42 }, (_, i) => 8 + ((i * 5) % 12)),
  );

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const isRunning = liveSession?.status === "live";
  const isPaused = liveSession?.status === "paused";
  const transcriptLines = useMemo(() => liveSession?.transcript ?? [], [liveSession?.transcript]);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const inputs = list.filter((device) => device.kind === "audioinput");
        setDevices(inputs);
        if (!deviceId && inputs[0]) setDeviceId(inputs[0].deviceId);
      } catch {
        setDevices([]);
      }
    };
    void loadDevices();
  }, [deviceId]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioContextRef.current) void audioContextRef.current.close();
    };
  }, []);

  const speakerChips = useMemo(() => {
    const seen = new Map<string, string>();
    for (const line of transcriptLines) {
      const id =
        line.speakerId ??
        (line as unknown as { speaker_id?: string }).speaker_id ??
        line.speaker;
      if (!seen.has(id)) seen.set(id, line.speaker);
    }
    return Array.from(seen.entries()).map(([id, label]) => ({
      id,
      label:
        speakerDrafts[id] ??
        liveSession?.intelligence?.speaker_labels?.[id] ??
        label,
    }));
  }, [transcriptLines, liveSession?.intelligence?.speaker_labels, speakerDrafts]);

  const resolveSpeakerId = (line: (typeof transcriptLines)[number]): string =>
    line.speakerId ??
    (line as unknown as { speaker_id?: string }).speaker_id ??
    line.speaker;

  const checkPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      setPermission("granted");
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setPermission("denied");
      setError("Microphone permission is blocked.");
    }
  };

  const startWave = (stream: MediaStream) => {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      const chunk = Math.max(1, Math.floor(data.length / 42));
      const next = Array.from({ length: 42 }, (_, index) => {
        const from = index * chunk;
        const to = Math.min(data.length, from + chunk);
        let total = 0;
        for (let i = from; i < to; i += 1) total += data[i];
        const avg = to > from ? total / (to - from) : 0;
        return Math.max(6, Math.min(24, Math.round(avg / 10)));
      });
      setWaveBars(next);
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
  };

  const stopWave = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setWaveBars(Array.from({ length: 42 }, (_, i) => 8 + ((i * 3) % 9)));
  };

  const startCapture = async () => {
    setError(null);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        sampleRate,
      },
    });
    const started = await startLiveSession({
      courtroom,
      inputDevice: deviceId || "default",
      sampleRate,
      chunkDurationMs: chunkMs,
    });
    setLiveSession(started);
    streamRef.current = stream;
    startWave(stream);
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (!event.data || event.data.size === 0 || !started.sessionId) return;
      void sendLiveChunk(started.sessionId, event.data).then(setLiveSession).catch(() => {});
    };
    recorder.start(chunkMs);
    recorderRef.current = recorder;
  };

  const onPlay = async () => {
    try {
      setBusyAction("play");
      if (isPaused && liveSession) {
        recorderRef.current?.resume();
        setLiveSession(await resumeLiveSession(liveSession.sessionId));
        setBusyAction(null);
        return;
      }
      if (!isRunning) await startCapture();
      setBusyAction(null);
    } catch (e) {
      setBusyAction(null);
      setError(e instanceof Error ? e.message : "Unable to start/resume.");
    }
  };

  const onPause = async () => {
    if (!liveSession || !isRunning) return;
    try {
      setBusyAction("pause");
      recorderRef.current?.pause();
      setLiveSession(await pauseLiveSession(liveSession.sessionId));
      setBusyAction(null);
    } catch (e) {
      setBusyAction(null);
      setError(e instanceof Error ? e.message : "Unable to pause.");
    }
  };

  const onStop = async () => {
    if (!liveSession) return;
    try {
      setBusyAction("stop");
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      streamRef.current = null;
      stopWave();
      await stopLiveSession(liveSession.sessionId);
      setLiveSession(null);
      setSpeakerDrafts({});
      setEditingSpeakerId(null);
      setBusyAction(null);
    } catch (e) {
      setBusyAction(null);
      setError(e instanceof Error ? e.message : "Unable to stop.");
    }
  };

  const applyLabels = async () => {
    if (!liveSession) return;
    const labels: Record<string, string> = {};
    for (const chip of speakerChips) {
      if (chip.label.trim()) labels[chip.id] = chip.label.trim();
    }
    try {
      const optimistic = {
        ...liveSession,
        transcript: liveSession.transcript.map((line) => {
          const sid = resolveSpeakerId(line);
          return labels[sid] ? { ...line, speaker: labels[sid] } : line;
        }),
        intelligence: {
          ...liveSession.intelligence,
          speaker_labels: {
            ...(liveSession.intelligence?.speaker_labels ?? {}),
            ...labels,
          },
        },
      };
      setLiveSession(optimistic);
      const updated = await applySpeakerLabels(liveSession.sessionId, labels);
      setLiveSession(updated);
      setEditingSpeakerId(null);
      setLabelSaved(true);
      window.setTimeout(() => setLabelSaved(false), 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to apply labels.");
    }
  };

  const timer = liveSession?.durationLabel ?? "00:00:00";
  const summary =
    liveSession?.intelligence?.summary ?? "Live intelligence will appear as the transcript updates.";
  const decisions = liveSession?.intelligence?.decisions ?? [];
  const actions = liveSession?.intelligence?.actions ?? [];

  return (
    <section className="h-[calc(100vh-9rem)] flex flex-col overflow-hidden">
      <div className="h-12 shrink-0 rounded-xl border border-white/10 bg-[#121826]/80 px-3">
        <div className="flex h-full items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-[#E5E7EB]">
            <span className={`h-2 w-2 rounded-full ${isRunning ? "bg-rose-400 animate-pulse" : "bg-zinc-500"}`} />
            <span>LIVE</span>
            <span
              className={
                isRunning
                  ? "rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200"
                  : isPaused
                    ? "rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200"
                    : "rounded-full border border-zinc-500/35 bg-zinc-500/10 px-2 py-0.5 text-[10px] text-zinc-300"
              }
            >
              {isRunning ? "Playing" : isPaused ? "Paused" : "Idle"}
            </span>
            <span className="text-[#9CA3AF]">{courtroom}</span>
            <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
              <Timer className="h-3.5 w-3.5" />
              {timer}
            </span>
          </div>
          <div className="hidden h-6 flex-1 items-center justify-center gap-[2px] px-3 md:flex">
            {waveBars.map((height, index) => (
              <span
                key={`top-bar-${index}`}
                className="w-[2px] rounded-full bg-cyan-300/70"
                style={{ height: Math.max(4, Math.min(14, Math.round(height * 0.5))) }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onPlay()}
              className={`rounded-full border p-1.5 transition-all active:scale-95 ${
                isRunning
                  ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                  : "border-white/20 text-[#E5E7EB]"
              }`}
              title="Play"
            >
              <Play className={`h-4 w-4 transition-all ${busyAction === "play" ? "opacity-70" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => void onPause()}
              className={`rounded-full border p-1.5 transition-all active:scale-95 ${
                isPaused
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                  : "border-white/20 text-[#E5E7EB]"
              }`}
              title="Pause"
            >
              <Pause className={`h-4 w-4 transition-all ${busyAction === "pause" ? "opacity-70" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => void onStop()}
              className="rounded-full border border-rose-400/40 p-1.5 text-rose-200 transition-all active:scale-95"
              title="Stop"
            >
              <Square className={`h-4 w-4 transition-all ${busyAction === "stop" ? "opacity-70" : ""}`} />
            </button>
            <button type="button" onClick={() => setShowSettings((v) => !v)} className="rounded-full border border-white/20 p-1.5 text-[#E5E7EB]" title="Settings">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showSettings ? (
        <div className="mt-2 shrink-0 rounded-xl border border-white/10 bg-[#121826]/80 p-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={() => void checkPermission()} className="rounded-md border border-white/15 px-2 py-1 text-[#E5E7EB]">
              Allow mic to record
            </button>
            <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="rounded-md border border-white/15 bg-[#0B0F19] px-2 py-1 text-[#E5E7EB]">
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Mic ${device.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <input value={courtroom} onChange={(e) => setCourtroom(e.target.value)} className="rounded-md border border-white/15 bg-[#0B0F19] px-2 py-1 text-[#E5E7EB]" />
            <input type="number" value={sampleRate} onChange={(e) => setSampleRate(Number(e.target.value) || 16000)} className="w-24 rounded-md border border-white/15 bg-[#0B0F19] px-2 py-1 text-[#E5E7EB]" />
            <input type="number" value={chunkMs} onChange={(e) => setChunkMs(Number(e.target.value) || 1000)} className="w-20 rounded-md border border-white/15 bg-[#0B0F19] px-2 py-1 text-[#E5E7EB]" />
          </div>
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        <div className="col-span-12 lg:col-span-8 flex min-h-0 flex-col gap-3 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            {speakerChips.map((speaker) => (
              <button
                key={speaker.id}
                type="button"
                onClick={() => setEditingSpeakerId(speaker.id)}
                className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100"
              >
                {editingSpeakerId === speaker.id ? (
                  <input
                    autoFocus
                    value={speaker.label}
                    onChange={(e) =>
                      setSpeakerDrafts((prev) => ({ ...prev, [speaker.id]: e.target.value }))
                    }
                    onBlur={() => void applyLabels()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void applyLabels();
                    }}
                    className="w-24 bg-transparent outline-none"
                  />
                ) : (
                  speaker.label
                )}
              </button>
            ))}
            {labelSaved ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-200">
                Saved
              </span>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#121826]/70 p-3">
            <div className="space-y-2">
              {transcriptLines.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">
                  Transcription will appear here once you start the session.
                </p>
              ) : (
                transcriptLines.map((line, index) => (
                  <article key={`${line.id}-${line.timestamp}-${index}`} className="rounded-lg bg-[#0B0F19]/70 p-2.5">
                    <p className="text-sm font-semibold text-cyan-200">{line.speaker}</p>
                    <p className="text-base text-[#E5E7EB]">&quot;{line.text}&quot;</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4 min-h-0 overflow-hidden rounded-xl border border-white/10 bg-[#121826]/70 p-3">
          <div className="flex h-full min-h-0 flex-col gap-2">
            <section className="rounded-lg bg-[#0B0F19]/70 p-2.5">
              <div className="mb-1 inline-flex items-center gap-2 text-sm text-cyan-200">
                <FileText className="h-4 w-4" />
                Summary
              </div>
              <p className="text-sm text-[#E5E7EB]">{summary}</p>
            </section>
            <section className="rounded-lg bg-[#0B0F19]/70 p-2.5">
              <div className="mb-1 inline-flex items-center gap-2 text-sm text-amber-200">
                <CheckCircle2 className="h-4 w-4" />
                Key decisions
              </div>
              <ul className="list-disc pl-5 text-sm text-[#E5E7EB]">
                {(decisions.length ? decisions : ["No decisions yet."]).map((item, idx) => (
                  <li key={`decision-${idx}`}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-[#0B0F19]/70 p-2.5">
              <div className="mb-1 text-sm text-emerald-200">Actions</div>
              <ul className="list-disc pl-5 text-sm text-[#E5E7EB]">
                {(actions.length
                  ? actions.map((a) => a.text)
                  : ["No action items yet."]).map((item, idx) => (
                  <li key={`action-${idx}`}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </aside>
      </div>
      {error ? <p className="mt-1 text-xs text-rose-200">{error}</p> : null}
      {permission === "denied" ? <p className="mt-1 text-xs text-amber-200">Microphone access is required for live capture.</p> : null}
    </section>
  );
}
