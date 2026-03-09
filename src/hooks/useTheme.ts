import { useMemo } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { getTheme, type Theme } from "../constants/colors";

export function useTheme(): Theme {
  const { isDarkMode } = useSettings();
  return useMemo(() => getTheme(isDarkMode), [isDarkMode]);
}
