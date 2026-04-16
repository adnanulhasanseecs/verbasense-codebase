"use client";

import { create } from "zustand";
import type { LiveSession } from "@/features/live/types/live.types";
import type { UserRole } from "@/lib/auth/roles";

type SessionFilters = {
  status: "all" | "processing" | "processed";
  query: string;
};

type AppStore = {
  currentRole: UserRole;
  currentSession: string | null;
  liveSession: LiveSession | null;
  filters: SessionFilters;
  setCurrentRole: (role: UserRole) => void;
  setCurrentSession: (sessionId: string | null) => void;
  setLiveSession: (session: LiveSession | null) => void;
  setFilters: (filters: Partial<SessionFilters>) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  currentRole: "viewer",
  currentSession: null,
  liveSession: null,
  filters: { status: "all", query: "" },
  setCurrentRole: (role) => set({ currentRole: role }),
  setCurrentSession: (sessionId) => set({ currentSession: sessionId }),
  setLiveSession: (session) => set({ liveSession: session }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
}));
