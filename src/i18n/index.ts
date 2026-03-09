import { pt } from "./pt";
import { en } from "./en";

export type Locale = "pt" | "en";
export type Translations = typeof pt;

const translations: Record<Locale, Translations> = { pt, en };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

export function interpolate(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
    text
  );
}
