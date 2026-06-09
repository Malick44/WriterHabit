import type { en } from "./en";

export type Locale = "en";

type Primitive = string | number | boolean | null | undefined;

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

type PrevDepth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type NestedKeyOf<T, Depth extends number = 8> = Depth extends 0
  ? ""
  : T extends Primitive
    ? ""
    : {
        [K in Extract<keyof T, string>]: `${K}${DotPrefix<NestedKeyOf<T[K], PrevDepth[Depth]>>}`;
      }[Extract<keyof T, string>];

export type Dictionary = typeof en;
export type TranslationKey = NestedKeyOf<Dictionary>;
export type TranslationParams = Record<string, string | number>;
export type TFunction = (key: TranslationKey, params?: TranslationParams) => string;

export type I18nContextValue = {
  locale: Locale;
  t: TFunction;
};
