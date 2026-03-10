import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Locale, Translations } from "../i18n";
import { getTranslations, interpolate } from "../i18n";

const STORAGE_KEYS = {
  LOCALE: "@ninho/locale",
  DARK_MODE: "@ninho/darkMode",
  USER_NAME: "@ninho/userName",
  USER_BIRD: "@ninho/userBird",
} as const;

interface SettingsState {
  locale: Locale;
  isDarkMode: boolean;
  userName: string;
  /** Id do pássaro escolhido (arara, tucano, etc.) */
  userBirdId: string;
  isLoaded: boolean;
}

interface SettingsContextValue extends SettingsState {
  t: Translations;
  i: (text: string, vars: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  setDarkMode: (enabled: boolean) => void;
  setUserName: (name: string) => void;
  setUserBirdId: (birdId: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>({
    locale: "pt",
    isDarkMode: false,
    userName: "Lucas",
    userBirdId: "arara",
    isLoaded: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const [locale, darkMode, userName, userBird] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LOCALE),
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
          AsyncStorage.getItem(STORAGE_KEYS.USER_BIRD),
        ]);
        setState((prev) => ({
          ...prev,
          locale: (locale as Locale) || "pt",
          isDarkMode: darkMode === "true",
          userName: userName || prev.userName,
          userBirdId: userBird || prev.userBirdId,
          isLoaded: true,
        }));
      } catch {
        setState((prev) => ({ ...prev, isLoaded: true }));
      }
    })();
  }, []);

  const persist = useCallback(async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  }, []);

  const setLocale = useCallback((locale: Locale) => {
    setState((prev) => ({ ...prev, locale }));
    persist(STORAGE_KEYS.LOCALE, locale);
  }, [persist]);

  const setDarkMode = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, isDarkMode: enabled }));
    persist(STORAGE_KEYS.DARK_MODE, String(enabled));
  }, [persist]);

  const setUserName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, userName: name }));
    persist(STORAGE_KEYS.USER_NAME, name);
  }, [persist]);

  const setUserBirdId = useCallback((birdId: string) => {
    setState((prev) => ({ ...prev, userBirdId: birdId }));
    persist(STORAGE_KEYS.USER_BIRD, birdId);
  }, [persist]);

  const t = getTranslations(state.locale);

  return (
    <SettingsContext.Provider
      value={{
        ...state,
        t,
        i: interpolate,
        setLocale,
        setDarkMode,
        setUserName,
        setUserBirdId,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
