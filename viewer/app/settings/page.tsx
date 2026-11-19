"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useSettings } from "@/providers/SettingsProvider";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  writeSettings,
  type FontSizeSetting,
  type LineHeightSetting,
  type SentinelSettings,
  type ThemeSetting,
  type TimestampFormatSetting,
} from "@/lib/settings";
import { applyTheme, setTheme } from "@/lib/theme";
import { APP_VERSION } from "@/lib/version";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "display", label: "Display" },
  { id: "connection", label: "Connection" },
  { id: "data", label: "Data" },
  { id: "about", label: "About" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const LINE_HEIGHT_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
];

const TIMESTAMP_OPTIONS = [
  { value: "local", label: "Local time" },
  { value: "iso", label: "ISO 8601" },
  { value: "relative", label: "Relative" },
];

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium text-ink-2">{label}</div>
      {children}
      {help ? (
        <p className="text-[11px] leading-[1.4] text-muted">{help}</p>
      ) : null}
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
      <p className="mt-0.5 text-[11.5px] text-muted">{description}</p>
    </div>
  );
}

function NumberInput({
  label,
  help,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  help?: string | undefined;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string | undefined;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} help={help}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step ?? 1}
          value={value}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            onChange(Number.isFinite(next) ? next : min);
          }}
          className="h-7 w-28 rounded-[5px] border border-line bg-surface px-2 font-mono text-[11.5px] text-ink tabular-nums transition-colors duration-150 hover:border-line-strong focus:border-ink"
        />
        {suffix ? (
          <span className="text-[11px] text-faint">{suffix}</span>
        ) : null}
      </div>
    </Field>
  );
}

export default function SettingsPage() {
  const saved = useSettings();
  const [section, setSection] = useState<SectionId>("display");
  const [draftOverride, setDraftOverride] = useState<SentinelSettings | null>(
    null,
  );
  const [justSaved, setJustSaved] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const savedTimer = useRef<number | null>(null);

  const draft = draftOverride ?? saved;
  const hasChanges =
    draftOverride !== null &&
    JSON.stringify(normalizeSettings(draft)) !== JSON.stringify(saved);

  useEffect(() => {
    return () => {
      if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!resetArmed) return;
    const timer = window.setTimeout(() => setResetArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [resetArmed]);

  const flashSaved = () => {
    setJustSaved(true);
    if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setJustSaved(false), 2000);
  };

  const update = <K extends keyof SentinelSettings>(
    key: K,
    value: SentinelSettings[K],
  ) => {
    setDraftOverride((prev) => ({ ...(prev ?? saved), [key]: value }));
    setJustSaved(false);
  };

  const handleTheme = (value: ThemeSetting) => {
    setTheme(value);
    setDraftOverride((prev) => ({ ...(prev ?? saved), theme: value }));
    setJustSaved(false);
  };

  const handleSave = () => {
    writeSettings(normalizeSettings(draft));
    setDraftOverride(null);
    flashSaved();
  };

  const handleReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    setResetArmed(false);
    writeSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
    setDraftOverride(null);
    flashSaved();
  };

  const renderDisplay = () => (
    <div className="space-y-5">
      <SectionTitle
        title="Display"
        description="How events and timestamps are rendered across the app."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Theme"
          options={THEME_OPTIONS}
          value={draft.theme}
          onChange={(value) => handleTheme(value as ThemeSetting)}
        />
        <Select
          label="Timestamp format"
          options={TIMESTAMP_OPTIONS}
          value={draft.timestampFormat}
          onChange={(value) =>
            update("timestampFormat", value as TimestampFormatSetting)
          }
        />
        <Select
          label="Event text size"
          options={FONT_SIZE_OPTIONS}
          value={draft.fontSize}
          onChange={(value) => update("fontSize", value as FontSizeSetting)}
        />
        <Select
          label="Line height"
          options={LINE_HEIGHT_OPTIONS}
          value={draft.lineHeight}
          onChange={(value) =>
            update("lineHeight", value as LineHeightSetting)
          }
        />
      </div>

      <div className="flex flex-col items-start gap-2.5 border-t border-line pt-4">
        <Checkbox
          checked={draft.showMilliseconds}
          onChange={(event) =>
            update("showMilliseconds", event.target.checked)
          }
          label="Show milliseconds in timestamps"
        />
        <Checkbox
          checked={draft.colorizeLevels}
          onChange={(event) => update("colorizeLevels", event.target.checked)}
          label="Colorize severity labels"
        />
      </div>
    </div>
  );

  const renderConnection = () => (
    <div className="space-y-5">
      <SectionTitle
        title="Connection"
        description="Where the viewer reads logs from. This browser connects directly to the API."
      />

      <Field
        label="API base URL"
        help="Applies after a reload. The live stream uses the same base URL."
      >
        <Input
          value={draft.apiEndpoint}
          onChange={(event) => update("apiEndpoint", event.target.value)}
          spellCheck={false}
          placeholder="http://localhost:8000/api"
        />
      </Field>

      <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <NumberInput
          label="Reconnect interval"
          help="Applies on the next connection."
          value={draft.reconnectInterval}
          min={500}
          max={60000}
          step={500}
          suffix="ms"
          onChange={(value) => update("reconnectInterval", value)}
        />
        <NumberInput
          label="Max reconnect attempts"
          help="Stops retrying after this many failures."
          value={draft.maxReconnectAttempts}
          min={1}
          max={50}
          onChange={(value) => update("maxReconnectAttempts", value)}
        />
      </div>
    </div>
  );

  const renderData = () => (
    <div className="space-y-5">
      <SectionTitle
        title="Data"
        description="What this browser keeps in memory while you watch the live feed."
      />

      <Field
        label="Events kept in memory"
        help="The live buffer is capped at this count. Older events scroll out automatically."
      >
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={500}
            max={10000}
            step={500}
            value={draft.maxLogsInMemory}
            onChange={(event) =>
              update("maxLogsInMemory", Number(event.target.value))
            }
            className="h-4 w-full max-w-[420px] cursor-pointer accent-ink"
          />
          <span className="w-16 text-right font-mono text-[11.5px] text-ink tabular-nums">
            {draft.maxLogsInMemory.toLocaleString()}
          </span>
        </div>
      </Field>

      <div className="border-t border-line pt-4">
        <Checkbox
          checked={draft.persistFilters}
          onChange={(event) => update("persistFilters", event.target.checked)}
          label="Remember live-feed filters between sessions"
        />
        <p className="mt-2 pl-[22px] text-[11px] leading-[1.4] text-muted">
          Search text, levels, sources, and the time window are restored the
          next time you open the live feed.
        </p>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-5">
      <SectionTitle
        title="About"
        description="Sentinel aggregates application logs and flags anomalies worth a look."
      />

      <dl className="divide-y divide-line border-y border-line">
        {[
          ["Version", `v${APP_VERSION}`],
          ["Runtime", "Next.js 16"],
          ["License", "Private"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-2.5 text-[11.5px]"
          >
            <dt className="text-muted">{label}</dt>
            <dd className="font-mono text-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-[11px] leading-[1.5] text-muted">
        Settings are stored in this browser only. Nothing is sent to a server.
      </p>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHead title="Settings" subtitle="Preferences for this browser" />

      <div className="flex min-h-0 flex-1">
        <aside className="w-[180px] shrink-0 overflow-y-auto border-r border-line px-2 py-3">
          <nav aria-label="Settings sections" className="space-y-0.5">
            {SECTIONS.map((item) => {
              const active = item.id === section;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "flex h-7 w-full cursor-pointer items-center rounded-[5px] px-2 text-left text-[12px] transition-colors duration-150",
                    active
                      ? "bg-selected font-[550] text-ink"
                      : "text-muted hover:bg-hover hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="max-w-[720px] px-5 py-4">
              {section === "display" ? renderDisplay() : null}
              {section === "connection" ? renderConnection() : null}
              {section === "data" ? renderData() : null}
              {section === "about" ? renderAbout() : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-line bg-canvas px-5 py-2.5">
            <span
              className="flex items-center gap-2 text-[11px] text-muted"
              aria-live="polite"
            >
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  hasChanges ? "bg-warn" : "bg-ok",
                )}
              />
              {hasChanges ? "Unsaved changes" : justSaved ? "Saved" : "No changes"}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleReset}
                title={
                  resetArmed
                    ? "Click again to reset every setting"
                    : "Reset all settings to defaults"
                }
              >
                {resetArmed ? "Confirm reset" : "Reset"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
