import { SETTINGS_EVENT, SETTINGS_KEY } from "./settings";

export type Theme = "light" | "dark" | "system";

export { SETTINGS_EVENT };

export function resolveTheme(
  theme: Theme,
  prefersDark: boolean,
): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return prefersDark ? "dark" : "light";
}

export function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return "light";
    const parsed = JSON.parse(raw) as { theme?: unknown };
    const theme = parsed?.theme;
    return theme === "dark" || theme === "light" || theme === "system"
      ? theme
      : "light";
  } catch {
    return "light";
  }
}

function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function themeSnapshot(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return resolveTheme(readTheme(), prefersDark());
}

export function subscribeTheme(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const media =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

  window.addEventListener(SETTINGS_EVENT, callback);
  window.addEventListener("storage", callback);
  media?.addEventListener("change", callback);

  return () => {
    window.removeEventListener(SETTINGS_EVENT, callback);
    window.removeEventListener("storage", callback);
    media?.removeEventListener("change", callback);
  };
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = resolveTheme(theme, prefersDark);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function setTheme(theme: Theme): void {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ ...current, theme }),
      );
    } catch {
      // storage unavailable — still apply for this session
    }
  }
  applyTheme(theme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }
}

export const THEME_SCRIPT = `(function(){try{var raw=localStorage.getItem("sentinel.settings");var s=raw?JSON.parse(raw):{};var t=s&&s.theme;if(t!=="light"&&t!=="dark"&&t!=="system"){t="light"}var d=t==="dark"||(t==="system"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.dataset.theme=d?"dark":"light";e.style.colorScheme=d?"dark":"light";}catch(err){document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";}})();`;
