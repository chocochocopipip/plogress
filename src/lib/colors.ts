export const DEFAULT_PRIMARY = "#1a1a1a";
export const DEFAULT_SECONDARY = "#f59e0b";

export const PRIMARY_PRESETS = [
  "#1a1a1a", // Black
  "#334155", // Slate
  "#1e3a5f", // Navy
  "#065f46", // Emerald
  "#7c2d12", // Brown
  "#581c87", // Purple
  "#be123c", // Rose
  "#0369a1", // Sky
];

export const SECONDARY_PRESETS = [
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#f97316", // Orange
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#14b8a6", // Teal
];

export function loadColors(): { primary: string; secondary: string } {
  if (typeof window === "undefined")
    return { primary: DEFAULT_PRIMARY, secondary: DEFAULT_SECONDARY };
  return {
    primary: localStorage.getItem("colorPrimary") || DEFAULT_PRIMARY,
    secondary: localStorage.getItem("colorSecondary") || DEFAULT_SECONDARY,
  };
}

export function saveColors(primary: string, secondary: string) {
  localStorage.setItem("colorPrimary", primary);
  localStorage.setItem("colorSecondary", secondary);
  applyColors(primary, secondary);
  window.dispatchEvent(new Event("settingsChanged"));
}

export function applyColors(primary: string, secondary: string) {
  document.documentElement.style.setProperty("--color-primary", primary);
  document.documentElement.style.setProperty("--color-secondary", secondary);
}
