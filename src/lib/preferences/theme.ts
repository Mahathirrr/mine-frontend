const THEME_MODE_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

export const THEME_MODE_VALUES = THEME_MODE_OPTIONS.map((o) => o.value);
export type ThemeMode = (typeof THEME_MODE_VALUES)[number];
export type ResolvedThemeMode = "light" | "dark";

// --- generated:themePresets:start ---

export const THEME_PRESET_OPTIONS = [
  {
    label: "Default",
    value: "default",
    primary: {
      light: "oklch(0.205 0 0)",
      dark: "oklch(0.922 0 0)",
    },
  },
  {
    label: "Brutalist",
    value: "brutalist",
    primary: {
      light: "oklch(0.6489 0.237 26.9728)",
      dark: "oklch(0.7044 0.1872 23.1858)",
    },
  },
  {
    label: "Evergreen",
    value: "evergreen",
    primary: {
      light: "oklch(0.5 0.11 155)",
      dark: "oklch(0.66 0.12 155)",
    },
  },
  {
    label: "Hearth",
    value: "hearth",
    primary: {
      light: "oklch(0.58 0.13 72)",
      dark: "oklch(0.74 0.12 72)",
    },
  },
  {
    label: "Meridian",
    value: "meridian",
    primary: {
      light: "oklch(0.52 0.1 198)",
      dark: "oklch(0.68 0.1 198)",
    },
  },
  {
    label: "Plum",
    value: "plum",
    primary: {
      light: "oklch(0.46 0.12 320)",
      dark: "oklch(0.68 0.11 320)",
    },
  },
  {
    label: "Rosewood",
    value: "rosewood",
    primary: {
      light: "oklch(0.5 0.09 30)",
      dark: "oklch(0.72 0.09 30)",
    },
  },
  {
    label: "Soft Pop",
    value: "soft-pop",
    primary: {
      light: "oklch(0.5106 0.2301 276.9656)",
      dark: "oklch(0.6801 0.1583 276.9349)",
    },
  },
  {
    label: "Tangerine",
    value: "tangerine",
    primary: {
      light: "oklch(0.64 0.17 36.44)",
      dark: "oklch(0.64 0.17 36.44)",
    },
  },
] as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);

export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]["value"];

// --- generated:themePresets:end ---
