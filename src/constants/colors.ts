export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textLight: string;
  danger: string;
  success: string;
  inactive: string;
  card: string;
  inputBg: string;
}

export const LightTheme: Theme = {
  primary: "#4A7C59",
  secondary: "#A8D5BA",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  border: "#E0E0E0",
  text: "#1A1A1A",
  textLight: "#6B7280",
  danger: "#EF4444",
  success: "#22C55E",
  inactive: "#9E9E9E",
  card: "#FFFFFF",
  inputBg: "#F3F4F6",
};

export const DarkTheme: Theme = {
  primary: "#6DAF80",
  secondary: "#2D4A35",
  background: "#0F1117",
  surface: "#1A1D27",
  border: "#2A2D37",
  text: "#F1F1F1",
  textLight: "#9CA3AF",
  danger: "#F87171",
  success: "#4ADE80",
  inactive: "#6B7280",
  card: "#1F2230",
  inputBg: "#252836",
};

export function getTheme(isDark: boolean): Theme {
  return isDark ? DarkTheme : LightTheme;
}

export const Colors = LightTheme;
