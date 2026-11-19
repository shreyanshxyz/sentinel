"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  applyDisplaySettings,
  settingsSnapshot,
  subscribeSettings,
  type SentinelSettings,
} from "@/lib/settings";

const SettingsContext = createContext<SentinelSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(
    subscribeSettings,
    settingsSnapshot,
    () => DEFAULT_SETTINGS,
  );

  useEffect(() => {
    applyDisplaySettings(settings);
  }, [settings]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SentinelSettings {
  return useContext(SettingsContext);
}
