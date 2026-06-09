import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";

import { en } from "./en";
import type { I18nContextValue, Locale, TranslationKey, TranslationParams } from "./types";

const dictionaries = {
  en,
} as const;

const I18nContext = createContext<I18nContextValue | null>(null);

export function resolveTemplate(locale: Locale, key: TranslationKey): string {
  const segments = key.split(".");
  let cursor: unknown = dictionaries[locale];

  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object" || !(segment in (cursor as Record<string, unknown>))) {
      throw new Error(`Missing i18n key: ${key}`);
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }

  if (typeof cursor !== "string") {
    throw new Error(`i18n key is not a string leaf: ${key}`);
  }

  return cursor;
}

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, token: string) => {
    if (!(token in params)) {
      return `{{${token}}}`;
    }
    return String(params[token]);
  });
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  return interpolate(resolveTemplate(locale, key), params);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale: Locale = "en";

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      t: (key, params) => translate(locale, key, params),
    };
  }, [locale]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export { en };
export type { Dictionary, I18nContextValue, Locale, TFunction, TranslationKey, TranslationParams } from "./types";
