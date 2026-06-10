import React, { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useI18n, type TranslationKey } from "@/i18n";
import { Modal as AppModal } from "@/shared/components/modals";
import {
  type GlacierThemeParam,
  type ThemeTuningColorControl,
  type ThemeTuningColorPreset,
  type ThemeTuningControl,
  type ThemeTuningControlScope,
  type ThemeTuningRangeControl,
  type ThemeTuningScreenConfig,
  type ThemeTuningValue,
  useGlacierThemeStore,
} from "@/shared/theme";

const PRIMARY_PRESETS = [
  { labelKey: "themeTuner.presets.primary.iceBlue", value: "#7dd3fc" },
  { labelKey: "themeTuner.presets.primary.cyberPurple", value: "#c8a0f0" },
  { labelKey: "themeTuner.presets.primary.neonCyan", value: "#22d3ee" },
  { labelKey: "themeTuner.presets.primary.emerald", value: "#34d399" },
  { labelKey: "themeTuner.presets.primary.ruby", value: "#fb7185" },
] satisfies readonly ThemeTuningColorPreset[];

const BACKGROUND_PRESETS = [
  { labelKey: "themeTuner.presets.background.deepNavy", value: "#0a0e1a" },
  { labelKey: "themeTuner.presets.background.obsidian", value: "#09090b" },
  { labelKey: "themeTuner.presets.background.cyberSlate", value: "#0f172a" },
  { labelKey: "themeTuner.presets.background.absoluteVoid", value: "#000000" },
] satisfies readonly ThemeTuningColorPreset[];

const GLOBAL_THEME_PARAMS = [
  "backgroundColor",
  "borderOpacity",
  "fontSizeScale",
  "glassOpacity",
  "glowIntensity",
  "glowSize",
  "iconSizeScale",
  "primaryColor",
  "tertiaryColor",
] as const satisfies readonly GlacierThemeParam[];

const GLOBAL_THEME_CONFIG = {
  controls: [
    {
      id: "global-background",
      kind: "color",
      labelKey: "themeTuner.baseBackground",
      param: "backgroundColor",
      presets: BACKGROUND_PRESETS,
      scope: "screen",
    },
    {
      id: "global-primary",
      kind: "color",
      labelKey: "themeTuner.primaryAccent",
      param: "primaryColor",
      presets: PRIMARY_PRESETS,
      scope: "screen",
    },
    {
      id: "global-glass-opacity",
      kind: "range",
      labelKey: "themeTuner.glassOpacity",
      max: 1,
      min: 0.1,
      param: "glassOpacity",
      scope: "component",
      step: 0.05,
      valueFormat: "percent",
    },
    {
      id: "global-border-opacity",
      kind: "range",
      labelKey: "themeTuner.borderOpacity",
      max: 0.8,
      min: 0,
      param: "borderOpacity",
      scope: "component",
      step: 0.05,
      valueFormat: "percent",
    },
    {
      id: "global-glow-intensity",
      kind: "range",
      labelKey: "themeTuner.glowIntensity",
      max: 0.3,
      min: 0,
      param: "glowIntensity",
      scope: "component",
      step: 0.01,
      valueFormat: "percent",
    },
    {
      id: "global-typography",
      kind: "range",
      labelKey: "themeTuner.typographyScale",
      max: 1.5,
      min: 0.8,
      param: "fontSizeScale",
      scope: "text",
      step: 0.1,
      valueFormat: "scale",
    },
    {
      id: "global-icon-size",
      kind: "range",
      labelKey: "themeTuner.iconSizeScale",
      max: 2,
      min: 0.5,
      param: "iconSizeScale",
      scope: "icon",
      step: 0.1,
      valueFormat: "scale",
    },
  ],
  defaultValues: {},
  descriptionKey: "themeTuner.global.description",
  id: "global",
  routePattern: "*",
  titleKey: "themeTuner.global.title",
} satisfies ThemeTuningScreenConfig;

const CONTROL_SCOPE_ORDER = ["screen", "component", "text", "icon"] as const satisfies readonly ThemeTuningControlScope[];

const CONTROL_SCOPE_LABEL_KEYS = {
  component: "themeTuner.groups.components",
  icon: "themeTuner.groups.icons",
  screen: "themeTuner.groups.screen",
  text: "themeTuner.groups.text",
} as const satisfies Record<ThemeTuningControlScope, TranslationKey>;

const CONTROL_SCOPE_ICONS = {
  component: "layers-outline",
  icon: "sparkles-outline",
  screen: "phone-portrait-outline",
  text: "text-outline",
} as const satisfies Record<ThemeTuningControlScope, keyof typeof Ionicons.glyphMap>;

function isGlobalThemeParam(param: string): param is GlacierThemeParam {
  return GLOBAL_THEME_PARAMS.includes(param as GlacierThemeParam);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function decimalPlaces(value: number) {
  const [, decimals = ""] = value.toString().split(".");

  return decimals.length;
}

function formatControlValue(control: ThemeTuningRangeControl, value: number) {
  if (control.valueFormat === "percent") {
    return `${Math.round(value * 100)}%`;
  }

  if (control.valueFormat === "scale") {
    return `${Math.round(value * 100)}%`;
  }

  return value.toFixed(decimalPlaces(control.step));
}

interface StepperControlProps {
  control: ThemeTuningRangeControl;
  onStep: (delta: number) => void;
  primaryColor: string;
  value: number;
}

const StepperControl = memo(function StepperControl({
  control,
  onStep,
  primaryColor,
  value,
}: StepperControlProps) {
  const { t } = useI18n();
  const label = t(control.labelKey);
  const fillPercent = clamp(((value - control.min) / (control.max - control.min)) * 100, 0, 100);

  return (
    <View style={styles.controlBlock}>
      <View style={styles.stepperHeader}>
        <Text style={styles.controlTitle}>{label}</Text>
        <Text style={[styles.stepperValue, { color: primaryColor }]}>{formatControlValue(control, value)}</Text>
      </View>
      <View style={styles.stepperRow}>
        <Pressable
          accessibilityLabel={t("themeTuner.decreaseAccessibility", { label })}
          accessibilityRole="button"
          onPress={() => onStep(-control.step)}
          style={styles.stepButton}
        >
          <Text style={styles.stepButtonText}>-</Text>
        </Pressable>
        <View style={styles.sliderTrackBg}>
          <View
            style={[
              styles.sliderTrackFill,
              {
                backgroundColor: primaryColor,
                width: `${fillPercent}%`,
              },
            ]}
          />
        </View>
        <Pressable
          accessibilityLabel={t("themeTuner.increaseAccessibility", { label })}
          accessibilityRole="button"
          onPress={() => onStep(control.step)}
          style={styles.stepButton}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
});

interface ColorControlProps {
  control: ThemeTuningColorControl;
  onSelect: (value: string) => void;
  primaryColor: string;
  value: string;
}

const ColorControl = memo(function ColorControl({
  control,
  onSelect,
  primaryColor,
  value,
}: ColorControlProps) {
  const { t } = useI18n();
  const label = t(control.labelKey);

  return (
    <View style={styles.controlBlock}>
      <Text style={styles.controlTitle}>{label}</Text>
      <View style={styles.presetGrid}>
        {control.presets.map((preset) => {
          const presetLabel = t(preset.labelKey);
          const isSelected = value === preset.value;

          return (
            <Pressable
              accessibilityLabel={t("themeTuner.presetAccessibility", { label: presetLabel })}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={`${control.id}-${preset.value}`}
              onPress={() => onSelect(preset.value)}
              style={[
                styles.presetItem,
                {
                  borderColor: isSelected ? primaryColor : "rgba(255, 255, 255, 0.12)",
                },
              ]}
            >
              <View style={[styles.colorIndicator, { backgroundColor: preset.value }]} />
              <Text style={styles.presetText}>{presetLabel}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

interface ThemeTuningPanelProps {
  showFloatingTrigger?: boolean;
}

export function ThemeTuningPanel({ showFloatingTrigger = true }: ThemeTuningPanelProps) {
  const { t } = useI18n();
  const {
    activeTuningScreenId,
    backgroundColor,
    borderOpacity,
    fontSizeScale,
    glassOpacity,
    glowIntensity,
    glowSize,
    iconSizeScale,
    isTuningPanelOpen,
    primaryColor,
    resetScreenTheme,
    resetTheme,
    screenThemeOverrides,
    screenTuningRegistry,
    setScreenThemeParam,
    setThemeParam,
    tertiaryColor,
    toggleTuningPanel,
  } = useGlacierThemeStore();

  const activeScreenConfig = activeTuningScreenId ? screenTuningRegistry[activeTuningScreenId] : null;
  const panelConfig = activeScreenConfig ?? GLOBAL_THEME_CONFIG;

  const globalValues = useMemo<Record<string, ThemeTuningValue>>(
    () => ({
      backgroundColor,
      borderOpacity,
      fontSizeScale,
      glassOpacity,
      glowIntensity,
      glowSize,
      iconSizeScale,
      primaryColor,
      tertiaryColor,
    }),
    [
      backgroundColor,
      borderOpacity,
      fontSizeScale,
      glassOpacity,
      glowIntensity,
      glowSize,
      iconSizeScale,
      primaryColor,
      tertiaryColor,
    ],
  );

  const panelValues = useMemo<Record<string, ThemeTuningValue>>(() => {
    if (!activeScreenConfig) {
      return globalValues;
    }

    return {
      ...activeScreenConfig.defaultValues,
      ...(screenThemeOverrides[activeScreenConfig.id] ?? {}),
    };
  }, [activeScreenConfig, globalValues, screenThemeOverrides]);

  const groupedControls = useMemo(
    () =>
      CONTROL_SCOPE_ORDER.map((scope) => ({
        controls: panelConfig.controls.filter((control) => control.scope === scope),
        scope,
      })).filter((group) => group.controls.length > 0),
    [panelConfig.controls],
  );

  const panelAccentColor =
    typeof panelValues.accentColor === "string"
      ? panelValues.accentColor
      : typeof panelValues.primaryColor === "string"
        ? panelValues.primaryColor
        : primaryColor;

  const handleSetControlValue = useCallback(
    (control: ThemeTuningControl, value: ThemeTuningValue) => {
      if (activeScreenConfig) {
        setScreenThemeParam(activeScreenConfig.id, control.param, value);
        return;
      }

      if (isGlobalThemeParam(control.param)) {
        setThemeParam(control.param, value);
      }
    },
    [activeScreenConfig, setScreenThemeParam, setThemeParam],
  );

  const handleRangeStep = useCallback(
    (control: ThemeTuningRangeControl, delta: number) => {
      const currentValue = panelValues[control.param];
      const numericValue = typeof currentValue === "number" ? currentValue : control.min;
      const nextValue = clamp(
        Number((numericValue + delta).toFixed(decimalPlaces(control.step))),
        control.min,
        control.max,
      );

      handleSetControlValue(control, nextValue);
    },
    [handleSetControlValue, panelValues],
  );

  const handleReset = useCallback(() => {
    if (activeScreenConfig) {
      resetScreenTheme(activeScreenConfig.id);
      return;
    }

    resetTheme();
  }, [activeScreenConfig, resetScreenTheme, resetTheme]);

  const resetFooter = (
    <View style={styles.footer}>
      <Pressable
        accessibilityLabel={t(activeScreenConfig ? "themeTuner.resetCurrentScreen" : "themeTuner.resetDefaults")}
        accessibilityRole="button"
        onPress={handleReset}
        style={[styles.resetButton, { borderColor: `${panelAccentColor}40` }]}
      >
        <Ionicons name="refresh-outline" size={16} color="#ffffff" style={styles.resetIcon} />
        <Text style={styles.resetButtonText}>
          {t(activeScreenConfig ? "themeTuner.resetCurrentScreen" : "themeTuner.resetDefaults")}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <>
      {showFloatingTrigger ? (
        <View style={styles.floatingTriggerContainer}>
          <Pressable
            accessibilityLabel={t("themeTuner.openAccessibility")}
            accessibilityRole="button"
            onPress={toggleTuningPanel}
            style={[
              styles.floatingTrigger,
              {
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderColor: `${panelAccentColor}40`,
              },
            ]}
          >
            <Ionicons name="settings-sharp" size={20} color={panelAccentColor} />
          </Pressable>
        </View>
      ) : null}

      <AppModal
        backdropOpacity={0.5}
        closeAccessibilityLabelKey="themeTuner.closeAccessibility"
        colorScheme="dark"
        contentContainerStyle={styles.modalContent}
        footer={resetFooter}
        mode="bottomSheet"
        onClose={toggleTuningPanel}
        panelStyle={[
          styles.panelContainer,
          {
            backgroundColor: "rgba(10, 14, 26, 0.95)",
            borderColor: `${panelAccentColor}30`,
          },
        ]}
        testID="theme-tuning-modal"
        titleKey="themeTuner.title"
        visible={isTuningPanelOpen}
      >
        <View style={[styles.contextCard, { borderColor: `${panelAccentColor}30` }]}>
          <Text style={styles.contextEyebrow}>
            {t(activeScreenConfig ? "themeTuner.activeScreen" : "themeTuner.global.active")}
          </Text>
          <Text style={styles.contextTitle}>{t(panelConfig.titleKey)}</Text>
          <Text style={styles.contextDescription}>{t(panelConfig.descriptionKey)}</Text>
        </View>

        {groupedControls.map((group) => (
          <View key={group.scope} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={CONTROL_SCOPE_ICONS[group.scope]} size={16} color={panelAccentColor} />
              <Text style={styles.sectionTitle}>{t(CONTROL_SCOPE_LABEL_KEYS[group.scope])}</Text>
            </View>

            {group.controls.map((control) => {
              const currentValue = panelValues[control.param];

              if (control.kind === "color") {
                return (
                  <ColorControl
                    control={control}
                    key={control.id}
                    onSelect={(nextValue) => handleSetControlValue(control, nextValue)}
                    primaryColor={panelAccentColor}
                    value={typeof currentValue === "string" ? currentValue : ""}
                  />
                );
              }

              return (
                <StepperControl
                  control={control}
                  key={control.id}
                  onStep={(delta) => handleRangeStep(control, delta)}
                  primaryColor={panelAccentColor}
                  value={typeof currentValue === "number" ? currentValue : control.min}
                />
              );
            })}
          </View>
        ))}
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  colorIndicator: {
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 7,
    borderWidth: 1,
    height: 14,
    width: 14,
  },
  contextCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  contextDescription: {
    color: "rgba(226, 232, 240, 0.78)",
    fontSize: 13,
    lineHeight: 18,
  },
  contextEyebrow: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  contextTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  controlBlock: {
    gap: 10,
  },
  controlTitle: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700",
  },
  floatingTrigger: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  floatingTriggerContainer: {
    position: "absolute",
    right: 16,
    top: 48,
    zIndex: 9999,
  },
  footer: {
    alignItems: "center",
  },
  modalContent: {
    gap: 22,
  },
  panelContainer: {
    borderBottomWidth: 0,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetItem: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  resetButton: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  resetIcon: {
    marginRight: 6,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sliderTrackBg: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    flex: 1,
    height: 6,
    overflow: "hidden",
  },
  sliderTrackFill: {
    borderRadius: 3,
    height: "100%",
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  stepButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  stepperHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepperRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "800",
  },
});
