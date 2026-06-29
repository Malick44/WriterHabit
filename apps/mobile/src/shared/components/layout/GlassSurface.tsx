import { type PropsWithChildren } from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import type { GlassColorScheme, GlassStyle } from "expo-glass-effect";

interface GlassSurfaceProps extends PropsWithChildren<ViewProps> {
  fallbackStyle?: StyleProp<ViewStyle>;
  glassColorScheme?: GlassColorScheme;
  glassStyle?: GlassStyle;
  glassViewStyle?: StyleProp<ViewStyle>;
  interactive?: boolean;
  tintColor?: string;
}

export function GlassSurface({
  children,
  fallbackStyle,
  glassColorScheme: _glassColorScheme,
  glassStyle: _glassStyle,
  glassViewStyle: _glassViewStyle,
  interactive: _interactive,
  style,
  tintColor: _tintColor,
  ...viewProps
}: GlassSurfaceProps) {
  return (
    <View {...viewProps} style={[fallbackStyle, style]}>
      {children}
    </View>
  );
}
