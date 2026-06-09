import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { spacing } from "@/design/tokens";

type SpaceValue = keyof typeof spacing | number;

interface InlineProps {
  children: ReactNode;
  gap?: SpaceValue;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function resolveSpace(value: SpaceValue): number {
  return typeof value === "number" ? value : spacing[value];
}

export function Inline({
  children,
  gap = "sm",
  align = "center",
  justify,
  wrap = true,
  style,
  testID,
}: InlineProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          alignItems: align,
          flexDirection: "row",
          flexWrap: wrap ? "wrap" : "nowrap",
          gap: resolveSpace(gap),
          justifyContent: justify,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
