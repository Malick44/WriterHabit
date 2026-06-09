import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from "react";

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

function splitTopLevelCommas(value: string): string[] {
  const segments: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;
    }

    if (char === "," && depth === 0) {
      segments.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  segments.push(value.slice(start).trim());

  return segments;
}

function parseIcuOptions(source: string): Record<string, string> {
  const options: Record<string, string> = {};
  let index = 0;

  while (index < source.length) {
    while (source[index] === " ") {
      index += 1;
    }

    const keyStart = index;
    while (index < source.length && source[index] !== " " && source[index] !== "{") {
      index += 1;
    }

    const key = source.slice(keyStart, index).trim();

    while (source[index] === " ") {
      index += 1;
    }

    if (!key || source[index] !== "{") {
      break;
    }

    index += 1;
    const messageStart = index;
    let depth = 1;

    while (index < source.length && depth > 0) {
      if (source[index] === "{") {
        depth += 1;
      }

      if (source[index] === "}") {
        depth -= 1;
      }

      index += 1;
    }

    options[key] = source.slice(messageStart, index - 1);
  }

  return options;
}

function formatIcuBlock(
  block: string,
  params: TranslationParams,
  locale: Locale,
): string {
  const [variableName, formatType, optionSource] = splitTopLevelCommas(block);
  const value = params[variableName];

  if (!formatType) {
    return value === undefined ? `{${block}}` : String(value);
  }

  const options = parseIcuOptions(optionSource ?? "");

  if (formatType === "plural") {
    const count = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(count)) {
      return `{${block}}`;
    }

    const exactMatch = options[`=${count}`];
    const pluralCategory = new Intl.PluralRules(locale).select(count);
    const selectedMessage = exactMatch ?? options[pluralCategory] ?? options.other;

    if (!selectedMessage) {
      return `{${block}}`;
    }

    return formatIcuMessage(selectedMessage.replaceAll("#", String(count)), params, locale);
  }

  if (formatType === "select") {
    const selectedMessage = options[String(value)] ?? options.other;

    if (!selectedMessage) {
      return `{${block}}`;
    }

    return formatIcuMessage(selectedMessage, params, locale);
  }

  return `{${block}}`;
}

function formatIcuMessage(template: string, params: TranslationParams, locale: Locale): string {
  let output = "";
  let index = 0;

  while (index < template.length) {
    if (template[index] === "{" && template[index + 1] === "{") {
      const legacyTokenEnd = template.indexOf("}}", index + 2);

      if (legacyTokenEnd === -1) {
        output += template[index];
        index += 1;
        continue;
      }

      output += template.slice(index, legacyTokenEnd + 2);
      index = legacyTokenEnd + 2;
      continue;
    }

    if (template[index] !== "{") {
      output += template[index];
      index += 1;
      continue;
    }

    const blockStart = index + 1;
    let cursor = blockStart;
    let depth = 1;

    while (cursor < template.length && depth > 0) {
      if (template[cursor] === "{") {
        depth += 1;
      }

      if (template[cursor] === "}") {
        depth -= 1;
      }

      cursor += 1;
    }

    if (depth !== 0) {
      output += template[index];
      index += 1;
      continue;
    }

    output += formatIcuBlock(template.slice(blockStart, cursor - 1).trim(), params, locale);
    index = cursor;
  }

  return output;
}

export function interpolate(template: string, params?: TranslationParams, locale: Locale = "en"): string {
  if (!params) {
    return template;
  }

  return formatIcuMessage(template, params, locale).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, token: string) => {
    if (!(token in params)) {
      return `{{${token}}}`;
    }
    return String(params[token]);
  });
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  return interpolate(resolveTemplate(locale, key), params, locale);
}

export function I18nProvider({ children, initialLocale = "en" }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    };
  }, [locale, setLocale]);

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
