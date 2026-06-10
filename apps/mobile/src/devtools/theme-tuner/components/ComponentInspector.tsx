import { memo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";

import type { TunableComponentConfig } from "../types";

interface ComponentInspectorProps {
  components: readonly TunableComponentConfig[];
  onSelect: (componentId: string | null) => void;
  selectedComponentId: string | null;
}

interface InspectorChipProps {
  accessibilityLabel: string;
  isSelected: boolean;
  label: string;
  onPress: () => void;
}

function InspectorChip({ accessibilityLabel, isSelected, label, onPress }: InspectorChipProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[styles.chip, isSelected ? styles.chipSelected : null]}
    >
      <Text numberOfLines={1} style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const ComponentInspector = memo(function ComponentInspector({
  components,
  onSelect,
  selectedComponentId,
}: ComponentInspectorProps) {
  const { t } = useI18n();

  if (components.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("themeTuner.inspector.componentsTitle")}</Text>
      <ScrollView contentContainerStyle={styles.chipRow} horizontal showsHorizontalScrollIndicator={false}>
        <InspectorChip
          accessibilityLabel={t("themeTuner.inspector.allTokens")}
          isSelected={selectedComponentId === null}
          label={t("themeTuner.inspector.allTokens")}
          onPress={() => onSelect(null)}
        />
        {components.map((component) => (
          <InspectorChip
            accessibilityLabel={t("themeTuner.inspector.selectComponentAccessibility", {
              name: component.name,
            })}
            isSelected={selectedComponentId === component.id}
            key={component.id}
            label={component.name}
            onPress={() => onSelect(component.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.action.primary.background,
    borderColor: colors.action.primary.background,
  },
  chipText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: colors.text.inverse,
  },
  container: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
