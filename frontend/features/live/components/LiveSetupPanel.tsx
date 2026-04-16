"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Settings2, Square } from "lucide-react";
import {
  applySpeakerLabels,
  pauseLiveSession,
  resumeLiveSession,
  sendLiveChunk,
  startLiveSession,
  stopLiveSession,
} from "@/lib/api/live";
import { useAppStore } from "@/store/app-store";

export function LiveSetupPanel() {
  const liveSession = useAppStore((state) => state.liveSession);
  const setLiveSession = useAppStore((state) => state.setLiveSession);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [courtroom, setCourtroom] = useState("Courtroom A");
  const [sampleRate, setSampleRate] = useState(16000);
  const [chunkMs, setChunkMs] = useState(1000);
  const [error, setError] = useState<string | null>(null);
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [waveBars, setWaveBars] = useState<number[]>(
    Array.from({ length: 36 }, (_, i) => 14 + ((i * 7) % 20)),
  );

  const isRunning = liveSession?.status === "live";
  const isPaused = liveSession?.status === "paused";
  const sessionId = liveSession?.sessionId ?? "not-started";

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
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const statusBadge = useMemo(() => {
    if (isRunning) return "LIVE";
    if (isPaused) return "PAUSED";
    if (liveSession) return "STOPPED";
    return "IDLE";
  }, [isPaused, isRunning, liveSession]);

  const checkPermission = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      setPermission("granted");
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setPermission("denied");
      setError("Microphone permission denied.");
    }
  };

  const start = async () => {
    setError(null);
    try {
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
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const render = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          const chunk = Math.max(1, Math.floor(data.length / 36));
          const next = Array.from({ length: 36 }, (_, index) => {
            const startIndex = index * chunk;
            const endIndex = Math.min(data.length, startIndex + chunk);
            let total = 0;
            for (let i = startIndex; i < endIndex; i += 1) total += data[i];
            const avg = endIndex > startIndex ? total / (endIndex - startIndex) : 0;
            return Math.max(6, Math.min(36, Math.round(avg / 7)));
          });
          setWaveBars(next);
          animationRef.current = requestAnimationFrame(render);
        };
        animationRef.current = requestAnimationFrame(render);
      }
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (!event.data || event.data.size === 0) return;
        if (!started.sessionId) return;
        void sendLiveChunk(started.sessionId, event.data).then(setLiveSession).catch(() => {});
      };
      recorder.start(chunkMs);
      recorderRef.current = recorder;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start live capture");
    }
  };

  const pause = async () => {
    if (!liveSession) return;
    try {
      recorderRef.current?.pause();
      setLiveSession(await pauseLiveSession(liveSession.sessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to pause");
    }
  };

  const resume = async () => {
    if (!liveSession) return;
    try {
      recorderRef.current?.resume();
      setLiveSession(await resumeLiveSession(liveSession.sessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resume");
    }
  };

  const stop = async () => {
    if (!liveSession) return;
    try {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      streamRef.current = null;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      analyserRef.current = null;
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setWaveBars(Array.from({ length: 36 }, (_, i) => 12 + ((i * 5) % 14)));
      await stopLiveSession(liveSession.sessionId);
      setLiveSession(null);
      setSpeakerLabels({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop");
    }
  };

  const detectedSpeakers = useMemo(() => {
    if (!liveSession) return [];
    const seen = new Map<string, string>();
    for (const line of liveSession.transcript ?? []) {
      const id = line.speakerId ?? line.speaker;
      if (!seen.has(id)) seen.set(id, line.speaker);
    }
    return Array.from(seen.entries()).map(([id, label]) => ({
      id,
      label,
      assigned:
        speakerLabels[id] ??
        liveSession.intelligence?.speaker_labels?.[id] ??
        label,
    }));
  }, [liveSession, speakerLabels]);

  const applyLabels = async () => {
    if (!liveSession) return;
    try {
      const payload: Record<string, string> = {};
      for (const speaker of detectedSpeakers) {
        const value = (speakerLabels[speaker.id] ?? speaker.assigned).trim();
        if (value) payload[speaker.id] = value;
      }
      const updated = await applySpeakerLabels(liveSession.sessionId, payload);
      setLiveSession(updated);
      setSpeakerLabels({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply speaker labels");
    }
  };

  return (
    <section className="space-y-3">
      {detectedSpeakers.length > 0 ? (
        <div className="max-w-4xl rounded-2xl border border-white/10 bg-[#121826]/70 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-[#9CA3AF]">Speaker labels</p>
          <div className="grid gap-2 md:grid-cols-3">
            {detectedSpeakers.map((speaker) => (
              <label key={speaker.id} className="rounded-lg border border-white/10 bg-[#0B0F19]/70 p-2 text-xs text-[#9CA3AF]">
                <span className="mb-1 block text-[#E5E7EB]">{speaker.label}</span>
                <input
                  value={speakerLabels[speaker.id] ?? speaker.assigned}
                  onChange={(e) =>
                    setSpeakerLabels((prev) => ({ ...prev, [speaker.id]: e.target.value }))
                  }
                  className="w-full rounded-md border border-white/10 bg-[#121826] px-2 py-1.5 text-sm text-white"
                  placeholder="Judge, Defense..."
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void applyLabels()}
            className="mt-2 rounded-md border border-cyan-400/40 px-3 py-1 text-xs font-semibold text-cyan-200"
          >
            Apply labels
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => void checkPermission()}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#E5E7EB]"
        >
          Allow mic to record
        </button>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#E5E7EB]"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121826]/80 px-4 py-3">
        <div className="absolute inset-0 flex items-center px-3 opacity-70">
          {waveBars.map((height, idx) => (
            <span
              key={`wave-${idx}`}
              className="mx-[1px] block w-[2px] rounded-full bg-cyan-300/70"
              style={{ height }}
            />
          ))}
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="text-[11px] text-[#9CA3AF]">
            <p className="font-mono">Session: {sessionId}</p>
            <p>{statusBadge}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void (isPaused ? resume() : start())}
              disabled={isRunning}
              className="rounded-full border border-white/20 bg-[#0B0F19] p-2 text-[#E5E7EB] disabled:opacity-40"
              title={isPaused ? "Resume" : "Start session"}
            >
              <Play className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void pause()}
              disabled={!isRunning}
              className="rounded-full border border-white/20 bg-[#0B0F19] p-2 text-[#E5E7EB] disabled:opacity-40"
              title="Pause"
            >
              <Pause className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              disabled={!liveSession}
              className="rounded-full border border-rose-400/40 bg-[#2A1117] p-2 text-rose-200 disabled:opacity-40"
              title="End session"
            >
              <Square className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showSettings ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#121826]/80 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[#9CA3AF]">
              Courtroom
              <input
                value={courtroom}
                onChange={(e) => setCourtroom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              Input Device
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 6)}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[#9CA3AF]">
              Sample Rate
              <input
                type="number"
                value={sampleRate}
                onChange={(e) => setSampleRate(Number(e.target.value) || 16000)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-[#9CA3AF]">
              Chunk Duration (ms)
              <input
                type="number"
                value={chunkMs}
                onChange={(e) => setChunkMs(Number(e.target.value) || 1000)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}
      <p className="text-[11px] text-[#9CA3AF]">Mic: {permission}</p>
    </section>
  );
}
