export type TokenValue = string | number;

export type TokenKind =
  | "borderWidth"
  | "color"
  | "elevation"
  | "fontSize"
  | "fontWeight"
  | "lineHeight"
  | "opacity"
  | "radius"
  | "size"
  | "spacing";

export type NumericTokenKind = Exclude<TokenKind, "color" | "fontWeight">;

export interface TunableTokenDefinition<TPath extends string = string> {
  /** Base value used when no dev override exists. */
  defaultValue: TokenValue;
  kind: TokenKind;
  max?: number;
  min?: number;
  /** Dot-separated token path, e.g. "colors.cardBackground". */
  path: TPath;
  /** Color swatches offered by the editor in addition to the default value. */
  presets?: readonly string[];
  step?: number;
}

export interface TunableScreenConfig<TPath extends string = string> {
  feature?: string;
  id: string;
  name: string;
  route?: string;
  tokens: readonly TunableTokenDefinition<TPath>[];
}

export interface TunableComponentConfig<TPath extends string = string> {
  id: string;
  name: string;
  screenId: string;
  /** Token paths from the owning screen's token definitions. */
  tokens: readonly TPath[];
}

export type TokenOverrides<TPath extends string = string> = Partial<Record<TPath, TokenValue>>;

/** screenId -> tokenPath -> overridden value */
export type ThemeTunerOverrides = Record<string, TokenOverrides>;
