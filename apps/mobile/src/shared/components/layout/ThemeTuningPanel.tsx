import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useI18n } from "@/i18n";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";

const PRIMARY_PRESETS = [
  { label: "Ice Blue", value: "#7dd3fc" },
  { label: "Cyber Purple", value: "#c8a0f0" },
  { label: "Neon Cyan", value: "#22d3ee" },
  { label: "Emerald", value: "#34d399" },
  { label: "Ruby", value: "#fb7185" },
];

const BACKGROUND_PRESETS = [
  { label: "Deep Navy", value: "#0a0e1a" },
  { label: "Obsidian", value: "#09090b" },
  { label: "Cyber Slate", value: "#0f172a" },
  { label: "Absolute Void", value: "#000000" },
];

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

  const handleStep = (
    param: "glassOpacity" | "borderOpacity" | "glowIntensity" | "fontSizeScale",
    delta: number,
    min: number,
    max: number
  ) => {
    const currentValue = useGlacierThemeStore.getState()[param];
    const nextValue = Math.min(max, Math.max(min, Number((currentValue + delta).toFixed(2))));
    setThemeParam(param, nextValue);
  };

  return (
    <>
      {/* Floating Gear Button */}
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

      {/* Tuning Dashboard Overlay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isTuningPanelOpen}
        onRequestClose={toggleTuningPanel}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.safeArea}>
            <View
              style={[
                styles.panelContainer,
                {
                  backgroundColor: "rgba(10, 14, 26, 0.95)",
                  borderColor: `${primaryColor}30`,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleGroup}>
                  <Ionicons name="options-outline" size={22} color={primaryColor} />
                  <Text style={[styles.headerTitle, { color: primaryColor }]}>
                    {t("themeTuner.title")}
                  </Text>
                </View>
                <Pressable
                  onPress={toggleTuningPanel}
                  accessibilityLabel={t("themeTuner.closeAccessibility")}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#ffffff" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Background Presets */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("themeTuner.baseBackground")}</Text>
                  <View style={styles.presetGrid}>
                    {BACKGROUND_PRESETS.map((preset) => (
                      <Pressable
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
                        <Text style={styles.presetText}>{preset.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Primary Colors */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("themeTuner.primaryAccent")}</Text>
                  <View style={styles.presetGrid}>
                    {PRIMARY_PRESETS.map((preset) => (
                      <Pressable
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
                        <Text style={styles.presetText}>{preset.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Glass Opacity */}
                <View style={styles.section}>
                  <View style={styles.stepperHeader}>
                    <Text style={styles.sectionTitle}>{t("themeTuner.glassOpacity")}</Text>
                    <Text style={[styles.stepperValue, { color: primaryColor }]}>
                      {Math.round(glassOpacity * 100)}%
                    </Text>
                  </View>
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={styles.stepButton}
                      onPress={() => handleStep("glassOpacity", -0.05, 0.1, 1.0)}
                    >
                      <Text style={styles.stepButtonText}>-</Text>
                    </Pressable>
                    <View style={styles.sliderTrackBg}>
                      <View
                        style={[
                          styles.sliderTrackFill,
                          { backgroundColor: primaryColor, width: `${glassOpacity * 100}%` },
                        ]}
                      />
                    </View>
                    <Pressable
                      style={styles.stepButton}
                      onPress={() => handleStep("glassOpacity", 0.05, 0.1, 1.0)}
                    >
                      <Text style={styles.stepButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Border Opacity */}
                <View style={styles.section}>
                  <View style={styles.stepperHeader}>
                    <Text style={styles.sectionTitle}>{t("themeTuner.borderOpacity")}</Text>
                    <Text style={[styles.stepperValue, { color: primaryColor }]}>
                      {Math.round(borderOpacity * 100)}%
                    </Text>
                  </View>
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={styles.stepButton}
                      onPress={() => handleStep("borderOpacity", -0.05, 0.0, 0.8)}
                    >
                      <Text style={styles.stepButtonText}>-</Text>
                    </Pressable>
                    <View style={styles.sliderTrackBg}>
                      <View
                        style={[
                          styles.sliderTrackFill,
                          { backgroundColor: primaryColor, width: `${(borderOpacity / 0.8) * 100}%` },
                        ]}
                      />
                    </View>
                    <Pressable
                      style={styles.stepButton}
                      onPress={() => handleStep("borderOpacity", 0.05, 0.0, 0.8)}
                    >
                      <Text style={styles.stepButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Glow Intensity */}
                <View style={styles.section}>
                  <View style={styles.stepperHeader}>
                    <Text style={styles.sectionTitle}>{t("themeTuner.glowIntensity")}</Text>
                    <Text style={[styles.stepperValue, { color: primaryColor }]}>
                      {Math.round(glowIntensity * 100)}%
                    </Text>
                  </View>
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={styles.stepButton}
                      onPress={() => handleStep("glowIntensity", -0.01, 0.0, 0.3)}
                    >
                      <Text style={styles.stepButtonText}>-</Text>
                    </Pressable>
                    <View style={styles.sliderTrackBg}>
                      <View
                        style={[
                          styles.sliderTrackFill,
                          { backgroundColor: primaryColor, width: `${(glowIntensity / 0.3) * 100}%` },
                        ]}
                      />
                    </View>
                    <Pressable
                      style={styles.stepButton}
                      onPress={() => handleStep("glowIntensity", 0.01, 0.0, 0.3)}
                    >
                      <Text style={styles.stepButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Font Size Scale */}
                <View style={styles.section}>
                  <View style={styles.stepperHeader}>
                    <Text style={styles.sectionTitle}>{t("themeTuner.typographyScale")}</Text>
                    <Text style={[styles.stepperValue, { color: primaryColor }]}>
                      {Math.round(fontSizeScale * 100)}%
                    </Text>
                  </View>
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={styles.stepButton}
                      onPress={() => handleStep("fontSizeScale", -0.1, 0.8, 1.5)}
                    >
                      <Text style={styles.stepButtonText}>-</Text>
                    </Pressable>
                    <View style={styles.sliderTrackBg}>
                      <View
                        style={[
                          styles.sliderTrackFill,
                          {
                            backgroundColor: primaryColor,
                            width: `${((fontSizeScale - 0.8) / 0.7) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <Pressable
                      style={styles.stepButton}
                      onPress={() => handleStep("fontSizeScale", 0.1, 0.8, 1.5)}
                    >
                      <Text style={styles.stepButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              {/* Reset to Default */}
              <View style={styles.footer}>
                <Pressable
                  onPress={resetTheme}
                  style={[styles.resetButton, { borderColor: `${primaryColor}40` }]}
                >
                  <Ionicons name="refresh-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.resetButtonText}>{t("themeTuner.resetDefaults")}</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingTriggerContainer: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 9999,
  },
  floatingTrigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  safeArea: {
    maxHeight: "85%",
  },
  panelContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  presetText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepperHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  sliderTrackBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  sliderTrackFill: {
    height: "100%",
    borderRadius: 3,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 16,
    alignItems: "center",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
