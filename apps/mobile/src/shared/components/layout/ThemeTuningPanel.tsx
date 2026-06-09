import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useI18n, type TranslationKey } from "@/i18n";
import { Modal as AppModal } from "@/shared/components/modals";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";

type ThemePreset = {
  labelKey: TranslationKey;
  value: string;
};

type AdjustableThemeParam = "glassOpacity" | "borderOpacity" | "glowIntensity" | "fontSizeScale";

const PRIMARY_PRESETS = [
  { labelKey: "themeTuner.presets.primary.iceBlue", value: "#7dd3fc" },
  { labelKey: "themeTuner.presets.primary.cyberPurple", value: "#c8a0f0" },
  { labelKey: "themeTuner.presets.primary.neonCyan", value: "#22d3ee" },
  { labelKey: "themeTuner.presets.primary.emerald", value: "#34d399" },
  { labelKey: "themeTuner.presets.primary.ruby", value: "#fb7185" },
] satisfies ThemePreset[];

const BACKGROUND_PRESETS = [
  { labelKey: "themeTuner.presets.background.deepNavy", value: "#0a0e1a" },
  { labelKey: "themeTuner.presets.background.obsidian", value: "#09090b" },
  { labelKey: "themeTuner.presets.background.cyberSlate", value: "#0f172a" },
  { labelKey: "themeTuner.presets.background.absoluteVoid", value: "#000000" },
] satisfies ThemePreset[];

interface StepperControlProps {
  fillPercent: number;
  labelKey: TranslationKey;
  onDecrease: () => void;
  onIncrease: () => void;
  primaryColor: string;
  valueLabel: string;
}

const StepperControl = memo(function StepperControl({
  fillPercent,
  labelKey,
  onDecrease,
  onIncrease,
  primaryColor,
  valueLabel,
}: StepperControlProps) {
  const { t } = useI18n();
  const label = t(labelKey);

  return (
    <View style={styles.section}>
      <View style={styles.stepperHeader}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <Text style={[styles.stepperValue, { color: primaryColor }]}>{valueLabel}</Text>
      </View>
      <View style={styles.stepperRow}>
        <Pressable
          accessibilityLabel={t("themeTuner.decreaseAccessibility", { label })}
          accessibilityRole="button"
          onPress={onDecrease}
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
          onPress={onIncrease}
          style={styles.stepButton}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
});

export function ThemeTuningPanel() {
  const { t } = useI18n();
  const {
    primaryColor,
    backgroundColor,
    glassOpacity,
    borderOpacity,
    glowIntensity,
    fontSizeScale,
    isTuningPanelOpen,
    setThemeParam,
    resetTheme,
    toggleTuningPanel,
  } = useGlacierThemeStore();

  const handleStep = useCallback(
    (param: AdjustableThemeParam, delta: number, min: number, max: number) => {
      const currentValue = useGlacierThemeStore.getState()[param];
      const nextValue = Math.min(max, Math.max(min, Number((currentValue + delta).toFixed(2))));
      setThemeParam(param, nextValue);
    },
    [setThemeParam],
  );

  const resetFooter = (
    <View style={styles.footer}>
      <Pressable
        accessibilityLabel={t("themeTuner.resetDefaults")}
        accessibilityRole="button"
        onPress={resetTheme}
        style={[styles.resetButton, { borderColor: `${primaryColor}40` }]}
      >
        <Ionicons name="refresh-outline" size={16} color="#ffffff" style={styles.resetIcon} />
        <Text style={styles.resetButtonText}>{t("themeTuner.resetDefaults")}</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <View style={styles.floatingTriggerContainer}>
        <Pressable
          accessibilityLabel={t("themeTuner.openAccessibility")}
          accessibilityRole="button"
          onPress={toggleTuningPanel}
          style={[
            styles.floatingTrigger,
            {
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderColor: `${primaryColor}40`,
            },
          ]}
        >
          <Ionicons name="settings-sharp" size={20} color={primaryColor} />
        </Pressable>
      </View>

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
            borderColor: `${primaryColor}30`,
          },
        ]}
        testID="theme-tuning-modal"
        titleKey="themeTuner.title"
        visible={isTuningPanelOpen}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("themeTuner.baseBackground")}</Text>
          <View style={styles.presetGrid}>
            {BACKGROUND_PRESETS.map((preset) => {
              const label = t(preset.labelKey);
              return (
                <Pressable
                  accessibilityLabel={t("themeTuner.presetAccessibility", { label })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: backgroundColor === preset.value }}
                  key={preset.value}
                  onPress={() => setThemeParam("backgroundColor", preset.value)}
                  style={[
                    styles.presetItem,
                    {
                      backgroundColor: preset.value,
                      borderColor: backgroundColor === preset.value ? primaryColor : "rgba(255, 255, 255, 0.1)",
                    },
                  ]}
                >
                  <Text style={styles.presetText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("themeTuner.primaryAccent")}</Text>
          <View style={styles.presetGrid}>
            {PRIMARY_PRESETS.map((preset) => {
              const label = t(preset.labelKey);
              return (
                <Pressable
                  accessibilityLabel={t("themeTuner.presetAccessibility", { label })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: primaryColor === preset.value }}
                  key={preset.value}
                  onPress={() => setThemeParam("primaryColor", preset.value)}
                  style={[
                    styles.presetItem,
                    {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderColor: primaryColor === preset.value ? primaryColor : "rgba(255, 255, 255, 0.1)",
                    },
                  ]}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: preset.value }]} />
                  <Text style={styles.presetText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <StepperControl
          fillPercent={glassOpacity * 100}
          labelKey="themeTuner.glassOpacity"
          onDecrease={() => handleStep("glassOpacity", -0.05, 0.1, 1)}
          onIncrease={() => handleStep("glassOpacity", 0.05, 0.1, 1)}
          primaryColor={primaryColor}
          valueLabel={`${Math.round(glassOpacity * 100)}%`}
        />

        <StepperControl
          fillPercent={(borderOpacity / 0.8) * 100}
          labelKey="themeTuner.borderOpacity"
          onDecrease={() => handleStep("borderOpacity", -0.05, 0, 0.8)}
          onIncrease={() => handleStep("borderOpacity", 0.05, 0, 0.8)}
          primaryColor={primaryColor}
          valueLabel={`${Math.round(borderOpacity * 100)}%`}
        />

        <StepperControl
          fillPercent={(glowIntensity / 0.3) * 100}
          labelKey="themeTuner.glowIntensity"
          onDecrease={() => handleStep("glowIntensity", -0.01, 0, 0.3)}
          onIncrease={() => handleStep("glowIntensity", 0.01, 0, 0.3)}
          primaryColor={primaryColor}
          valueLabel={`${Math.round(glowIntensity * 100)}%`}
        />

        <StepperControl
          fillPercent={((fontSizeScale - 0.8) / 0.7) * 100}
          labelKey="themeTuner.typographyScale"
          onDecrease={() => handleStep("fontSizeScale", -0.1, 0.8, 1.5)}
          onIncrease={() => handleStep("fontSizeScale", 0.1, 0.8, 1.5)}
          primaryColor={primaryColor}
          valueLabel={`${Math.round(fontSizeScale * 100)}%`}
        />
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  colorIndicator: {
    borderRadius: 6,
    height: 12,
    width: 12,
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
    gap: 24,
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
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
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
    fontWeight: "600",
  },
  resetIcon: {
    marginRight: 6,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
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
    fontWeight: "700",
  },
});
