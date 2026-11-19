export const SETTINGS_KEY = "sentinel.settings";
export const SETTINGS_EVENT = "sentinel:settings";
export const FILTERS_KEY = "sentinel.filters";

export type ThemeSetting = "light" | "dark" | "system";
export type FontSizeSetting = "small" | "medium" | "large";
export type LineHeightSetting = "compact" | "normal" | "relaxed";
export type TimestampFormatSetting = "iso" | "local" | "relative";

export interface SentinelSettings {
  theme: ThemeSetting;
  fontSize: FontSizeSetting;
  lineHeight: LineHeightSetting;
  timestampFormat: TimestampFormatSetting;
  showMilliseconds: boolean;
  colorizeLevels: boolean;
  apiEndpoint: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  maxLogsInMemory: number;
  persistFilters: boolean;
}

const ENV_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const DEFAULT_SETTINGS: SentinelSettings = {
  theme: "light",
  fontSize: "medium",
  lineHeight: "normal",
  timestampFormat: "local",
  showMilliseconds: true,
  colorizeLevels: true,
  apiEndpoint: ENV_API_URL,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  maxLogsInMemory: 1000,
  persistFilters: true,
};

const FONT_SIZE_VALUES: Record<FontSizeSetting, string> = {
  small: "10.5px",
  medium: "11.5px",
  large: "12.5px",
};

const LEADING_VALUES: Record<LineHeightSetting, string> = {
  compact: "1.3",
  normal: "1.4",
  relaxed: "1.55",
};

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function normalizeSettings(raw: unknown): SentinelSettings {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    theme: isOneOf(input.theme, ["light", "dark", "system"] as const)
      ? input.theme
      : DEFAULT_SETTINGS.theme,
    fontSize: isOneOf(input.fontSize, ["small", "medium", "large"] as const)
      ? input.fontSize
      : DEFAULT_SETTINGS.fontSize,
    lineHeight: isOneOf(input.lineHeight, [
      "compact",
      "normal",
      "relaxed",
    ] as const)
      ? input.lineHeight
      : DEFAULT_SETTINGS.lineHeight,
    timestampFormat: isOneOf(input.timestampFormat, [
      "iso",
      "local",
      "relative",
    ] as const)
      ? input.timestampFormat
      : DEFAULT_SETTINGS.timestampFormat,
    showMilliseconds:
      typeof input.showMilliseconds === "boolean"
        ? input.showMilliseconds
        : DEFAULT_SETTINGS.showMilliseconds,
    colorizeLevels:
      typeof input.colorizeLevels === "boolean"
        ? input.colorizeLevels
        : DEFAULT_SETTINGS.colorizeLevels,
    apiEndpoint:
      typeof input.apiEndpoint === "string" && input.apiEndpoint.trim()
        ? input.apiEndpoint.trim()
        : DEFAULT_SETTINGS.apiEndpoint,
    reconnectInterval: clampInt(
      input.reconnectInterval,
      500,
      60000,
      DEFAULT_SETTINGS.reconnectInterval,
    ),
    maxReconnectAttempts: clampInt(
      input.maxReconnectAttempts,
      1,
      50,
      DEFAULT_SETTINGS.maxReconnectAttempts,
    ),
    maxLogsInMemory: clampInt(
      input.maxLogsInMemory,
      500,
      20000,
      DEFAULT_SETTINGS.maxLogsInMemory,
    ),
    persistFilters:
      typeof input.persistFilters === "boolean"
        ? input.persistFilters
        : DEFAULT_SETTINGS.persistFilters,
  };
}

let cachedRaw: string | null = null;
let cachedSettings: SentinelSettings = DEFAULT_SETTINGS;

export function getSettings(): SentinelSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SETTINGS_KEY);
  } catch {
    return DEFAULT_SETTINGS;
  }

  if (raw === cachedRaw) return cachedSettings;

  cachedRaw = raw;
  cachedSettings = raw ? normalizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  return cachedSettings;
}

export function settingsSnapshot(): SentinelSettings {
  return getSettings();
}

export function subscribeSettings(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(SETTINGS_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SETTINGS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function writeSettings(settings: SentinelSettings): void {
  if (typeof window === "undefined") return;

  const normalized = normalizeSettings(settings);
  const serialized = JSON.stringify(normalized);

  cachedRaw = serialized;
  cachedSettings = normalized;

  try {
    window.localStorage.setItem(SETTINGS_KEY, serialized);
  } catch {
    // storage unavailable — apply for this session only
  }

  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

export function getApiBaseUrl(): string {
  return getSettings().apiEndpoint;
}

export function applyDisplaySettings(settings: SentinelSettings): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const size = FONT_SIZE_VALUES[settings.fontSize];
  root.style.setProperty("--log-size", size);
  root.style.setProperty("--log-meta", `calc(${size} - 1px)`);
  root.style.setProperty("--log-leading", LEADING_VALUES[settings.lineHeight]);
}

export function settingsBootstrap(): string {
  return `(function(){try{var raw=localStorage.getItem("${SETTINGS_KEY}");var s=raw?JSON.parse(raw):{};var sizes={small:"10.5px",medium:"11.5px",large:"12.5px"};var leadings={compact:"1.3",normal:"1.4",relaxed:"1.55"};var e=document.documentElement;var size=sizes[s&&s.fontSize]||"11.5px";e.style.setProperty("--log-size",size);e.style.setProperty("--log-meta","calc("+size+" - 1px)");e.style.setProperty("--log-leading",leadings[s&&s.lineHeight]||"1.4");}catch(err){}})();`;
}

export interface StoredFilters {
  searchQuery: string;
  levels: string[];
  sources: string[];
  range: string;
}

const RANGE_VALUES = ["15m", "1h", "24h", "7d"] as const;

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
}

export function readStoredFilters(): StoredFilters | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const levels = stringArray(parsed.levels);
    const sources = stringArray(parsed.sources);
    const range = isOneOf(parsed.range, RANGE_VALUES)
      ? parsed.range
      : "1h";

    return {
      searchQuery:
        typeof parsed.searchQuery === "string" ? parsed.searchQuery : "",
      levels: levels ?? [],
      sources: sources ?? [],
      range,
    };
  } catch {
    return null;
  }
}

export function writeStoredFilters(filters: StoredFilters): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // storage unavailable — filters stay in memory
  }
}

export function clearStoredFilters(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(FILTERS_KEY);
  } catch {
    // storage unavailable
  }
}
