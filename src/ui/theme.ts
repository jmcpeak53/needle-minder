export const colors = {
  // Paper palette
  bg: "#efe9dd",
  bg2: "#e6dece",
  card: "#faf6ec",
  card2: "#f3ecdb",

  // Ink
  ink: "#1d1a16",
  ink2: "#3c372f",
  ink3: "#6e6759",
  ink4: "#a59c89",

  // Borders
  rule: "#d9cfb6",
  ruleSoft: "#e7dfc9",

  // Accent
  accent: "#b4472e",
  accentSoft: "#e8c9b9",
  warn: "#c98a2a",
  ok: "#5a7a4a",

  // Legacy aliases (keep for existing code)
  background: "#efe9dd",
  surface: "#faf6ec",
  muted: "#6e6759",
  border: "#d9cfb6",
  green: "#5a7a4a",
  accentDark: "#81272D"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999
};

// Font family keys — loaded in app/_layout.tsx via useFonts
export const font = {
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  sans: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
  sansSemiBold: "DMSans_600SemiBold",
  sansBold: "DMSans_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium"
};

// Bottom nav height constant (used to pad scrollable content)
export const NAV_HEIGHT = 86;
