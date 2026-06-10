import { memo, useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";

import type { NumericTokenKind, TokenValue, TunableTokenDefinition } from "../types";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const DEFAULT_COLOR_SWATCHES = [
  "#FFFFFF",
  "#F8FAFC",
  "#0F172A",
  "#1D4ED8",
  "#22D3EE",
  "#16A34A",
  "#F59E0B",
  "#DC2626",
  "#7C3AED",
] as const;

const FONT_WEIGHT_OPTIONS = ["300", "400", "500", "600", "700", "800", "900"] as const;

const NUMERIC_RANGES: Record<NumericTokenKind, { max: number; min: number; step: number }> = {
  borderWidth: { max: 8, min: 0, step: 1 },
  elevation: { max: 24, min: 0, step: 1 },
  fontSize: { max: 48, min: 8, step: 1 },
  lineHeight: { max: 72, min: 8, step: 2 },
  opacity: { max: 1, min: 0, step: 0.05 },
  radius: { max: 48, min: 0, step: 2 },
  size: { max: 120, min: 4, step: 2 },
  spacing: { max: 64, min: 0, step: 2 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function decimalPlaces(value: number) {
  const [, decimals = ""] = value.toString().split(".");

  return decimals.length;
}

function formatNumericValue(value: number, step: number) {
  return value.toFixed(decimalPlaces(step));
}

interface TokenEditorProps {
  definition: TunableTokenDefinition;
  isOverridden: boolean;
  onChange: (value: TokenValue) => void;
  onReset: () => void;
  value: TokenValue;
}

function ColorValueEditor({ definition, onChange, value }: Pick<TokenEditorProps, "definition" | "onChange" | "value">) {
  const { t } = useI18n();
  const currentValue = typeof value === "string" ? value : String(value);
  // The draft only applies while it belongs to the committed value; swatch
  // taps and resets change `currentValue`, which invalidates stale drafts
  // without needing a sync effect.
  const [draftState, setDraftState] = useState({ source: currentValue, text: currentValue });
  const draft = draftState.source === currentValue ? draftState.text : currentValue;

  const handleChangeText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      const isValid = HEX_COLOR_PATTERN.test(trimmed);

      setDraftState({ source: isValid ? trimmed : currentValue, text });

      if (isValid) {
        onChange(trimmed);
      }
    },
    [currentValue, onChange],
  );

  const swatches = [
    String(definition.defaultValue),
    ...(definition.presets ?? DEFAULT_COLOR_SWATCHES),
  ].filter((swatch, index, all) => all.indexOf(swatch) === index);

  return (
    <View style={styles.editorBody}>
      <View style={styles.swatchRow}>
        {swatches.map((swatch) => {
          const isSelected = swatch.toLowerCase() === currentValue.toLowerCase();

          return (
            <Pressable
              accessibilityLabel={t("themeTuner.presetAccessibility", { label: swatch })}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={swatch}
              onPress={() => onChange(swatch)}
              style={[styles.swatch, { backgroundColor: swatch }, isSelected ? styles.swatchSelected : null]}
            />
          );
        })}
      </View>
      <TextInput
        accessibilityLabel={t("themeTuner.inspector.hexAccessibility", { token: definition.path })}
        autoCapitalize="characters"
        autoCorrect={false}
        onChangeText={handleChangeText}
        placeholder={t("themeTuner.inspector.hexPlaceholder")}
        placeholderTextColor={colors.text.muted}
        style={styles.hexInput}
        value={draft}
      />
    </View>
  );
}

function FontWeightValueEditor({
  definition,
  onChange,
  value,
}: Pick<TokenEditorProps, "definition" | "onChange" | "value">) {
  const { t } = useI18n();
  const currentValue = String(value);

  return (
    <View style={[styles.editorBody, styles.weightRow]}>
      {FONT_WEIGHT_OPTIONS.map((weight) => {
        const isSelected = weight === currentValue;

        return (
          <Pressable
            accessibilityLabel={t("themeTuner.inspector.weightAccessibility", {
              token: definition.path,
              weight,
            })}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={weight}
            onPress={() => onChange(weight)}
            style={[styles.weightChip, isSelected ? styles.weightChipSelected : null]}
          >
            <Text style={[styles.weightChipText, { fontWeight: weight }, isSelected ? styles.weightChipTextSelected : null]}>
              {weight}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NumericValueEditor({
  definition,
  onChange,
  value,
}: Pick<TokenEditorProps, "definition" | "onChange" | "value">) {
  const { t } = useI18n();
  const range = NUMERIC_RANGES[definition.kind as NumericTokenKind];
  const max = definition.max ?? range.max;
  const min = definition.min ?? range.min;
  const step = definition.step ?? range.step;
  const numericValue = typeof value === "number" ? value : min;
  const fillPercent = clamp(((numericValue - min) / (max - min || 1)) * 100, 0, 100);

  const handleStep = (delta: number) => {
    const next = clamp(Number((numericValue + delta).toFixed(decimalPlaces(step))), min, max);

    onChange(next);
  };

  return (
    <View style={[styles.editorBody, styles.stepperRow]}>
      <Pressable
        accessibilityLabel={t("themeTuner.decreaseAccessibility", { label: definition.path })}
        accessibilityRole="button"
        onPress={() => handleStep(-step)}
        style={styles.stepButton}
      >
        <Ionicons color={colors.text.primary} name="remove" size={18} />
      </Pressable>
      <View style={styles.trackBackground}>
        <View style={[styles.trackFill, { width: `${fillPercent}%` }]} />
      </View>
      <Pressable
        accessibilityLabel={t("themeTuner.increaseAccessibility", { label: definition.path })}
        accessibilityRole="button"
        onPress={() => handleStep(step)}
        style={styles.stepButton}
      >
        <Ionicons color={colors.text.primary} name="add" size={18} />
      </Pressable>
      <Text style={styles.stepperValue}>{formatNumericValue(numericValue, step)}</Text>
    </View>
  );
}

export const TokenEditor = memo(function TokenEditor({
  definition,
  isOverridden,
  onChange,
  onReset,
  value,
}: TokenEditorProps) {
  const { t } = useI18n();

  return (
    <View style={[styles.container, isOverridden ? styles.containerOverridden : null]}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text selectable style={styles.path}>
            {definition.path}
          </Text>
          {isOverridden ? (
            <Text style={styles.defaultValue}>
              {t("themeTuner.inspector.defaultValueLabel", { value: String(definition.defaultValue) })}
            </Text>
          ) : null}
        </View>
        {isOverridden ? (
          <Pressable
            accessibilityLabel={t("themeTuner.inspector.resetTokenAccessibility", { token: definition.path })}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onReset}
            style={styles.resetButton}
          >
            <Ionicons color={colors.text.link} name="refresh-outline" size={16} />
          </Pressable>
        ) : null}
      </View>

      {definition.kind === "color" ? (
        <ColorValueEditor definition={definition} onChange={onChange} value={value} />
      ) : definition.kind === "fontWeight" ? (
        <FontWeightValueEditor definition={definition} onChange={onChange} value={value} />
      ) : (
        <NumericValueEditor definition={definition} onChange={onChange} value={value} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  containerOverridden: {
    borderColor: colors.border.focus,
  },
  defaultValue: {
    color: colors.text.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  editorBody: {
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  hexInput: {
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text.primary,
    fontFamily: "Menlo",
    fontSize: 13,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  path: {
    color: colors.text.primary,
    fontFamily: "Menlo",
    fontSize: 12,
    fontWeight: "600",
  },
  resetButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  stepperRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  stepperValue: {
    color: colors.text.primary,
    fontFamily: "Menlo",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 44,
    textAlign: "right",
  },
  swatch: {
    borderColor: colors.border.strong,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 28,
    width: 28,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatchSelected: {
    borderColor: colors.border.focus,
    borderWidth: 3,
  },
  trackBackground: {
    backgroundColor: colors.background.subtle,
    borderRadius: radius.full,
    flex: 1,
    height: 6,
    marginHorizontal: spacing.sm,
    overflow: "hidden",
  },
  trackFill: {
    backgroundColor: colors.action.primary.background,
    borderRadius: radius.full,
    height: "100%",
  },
  weightChip: {
    alignItems: "center",
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  weightChipSelected: {
    backgroundColor: colors.action.primary.background,
    borderColor: colors.action.primary.background,
  },
  weightChipText: {
    color: colors.text.primary,
    fontSize: 12,
  },
  weightChipTextSelected: {
    color: colors.text.inverse,
  },
  weightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
