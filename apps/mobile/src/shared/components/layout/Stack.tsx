import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { spacing } from "@/design/tokens";

type SpaceValue = keyof typeof spacing | number;

interface StackProps {
  children: ReactNode;
  gap?: SpaceValue;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function resolveSpace(value: SpaceValue): number {
  return typeof value === "number" ? value : spacing[value];
}

export function Stack({ children, gap = "md", align, justify, style, testID }: StackProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          gap: resolveSpace(gap),
          alignItems: align,
          justifyContent: justify,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
