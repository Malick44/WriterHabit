import { useMemo, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors, palette, withAlpha } from "@/design/tokens";

export type ComposerSurfaceGradient = [string, string, string];

export type ComposerSurfacePalette = {
  background: string;
  border: string;
  gradient: ComposerSurfaceGradient;
  orbPrimary: string;
  orbSecondary: string;
  shadow: string;
};

/**
 * Themed default palette tuned to the paper/green/gold design tokens. Screens can
 * pass their own palette, but this keeps the surface consistent across the app.
 */
export const composerSurfacePalette: ComposerSurfacePalette = {
  background: colors.dashboard.background,
  border: colors.dashboard.outlineVariant,
  gradient: [palette.slate[50], palette.paper[100], palette.paper[500]],
  orbPrimary: withAlpha(palette.blue[700], 0.06),
  orbSecondary: withAlpha(palette.amber[700], 0.06),
  shadow: colors.dashboard.outline,
};

type ComposerSurfaceProps = {
  children: ReactNode;
  palette?: ComposerSurfacePalette;
  isModal?: boolean;
  isWideTablet?: boolean;
  showOrbs?: boolean;
  style?: StyleProp<ViewStyle>;
  gradientColors?: ComposerSurfaceGradient;
};

export function ComposerSurface({
  children,
  palette = composerSurfacePalette,
  isModal = false,
  isWideTablet = false,
  showOrbs = true,
  style,
  gradientColors,
}: ComposerSurfaceProps) {
  const styles = useMemo(
    () => createStyles(palette, isWideTablet),
    [isWideTablet, palette],
  );
  const gradientStart = gradientColors?.[0] ?? palette.gradient[0];
  const gradientMiddle = gradientColors?.[1] ?? palette.gradient[1];
  const gradientEnd = gradientColors?.[2] ?? palette.gradient[2];
  const resolvedGradientColors = useMemo<ComposerSurfaceGradient>(
    () => [gradientStart, gradientMiddle, gradientEnd],
    [gradientEnd, gradientMiddle, gradientStart],
  );

  return (
    <View
      style={[
        styles.surface,
        isModal ? styles.surfaceModal : styles.surfaceScreen,
        style,
      ]}
    >
      <LinearGradient
        colors={resolvedGradientColors}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={styles.surfaceGradient}
      />

      {showOrbs ? (
        <>
          <View pointerEvents="none" style={styles.heroOrbPrimary} />
          <View pointerEvents="none" style={styles.heroOrbSecondary} />
        </>
      ) : null}

      {children}
    </View>
  );
}

const createStyles = (palette: ComposerSurfacePalette, isWideTablet: boolean) =>
  StyleSheet.create({
    heroOrbPrimary: {
      backgroundColor: palette.orbPrimary,
      borderRadius: 90,
      height: 180,
      position: "absolute",
      right: -56,
      top: -24,
      width: 180,
    },
    heroOrbSecondary: {
      backgroundColor: palette.orbSecondary,
      borderRadius: 70,
      height: 140,
      left: -44,
      position: "absolute",
      top: 120,
      width: 140,
    },
    surface: {
      backgroundColor: palette.background,
      flex: 1,
      overflow: "hidden",
    },
    surfaceGradient: {
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    surfaceModal: {
      alignSelf: "center",
      borderColor: palette.border,
      borderTopLeftRadius: isWideTablet ? 30 : 28,
      borderTopRightRadius: isWideTablet ? 30 : 28,
      borderWidth: isWideTablet ? 1 : 0,
      elevation: 16,
      maxWidth: isWideTablet ? 1180 : undefined,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      width: "100%",
    },
    surfaceScreen: {
      flex: 1,
    },
  });
