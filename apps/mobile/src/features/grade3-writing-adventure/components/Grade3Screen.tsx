import { Screen } from "@/shared/components";
import { spacing } from "@/design/tokens";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Grade3ScreenProps = ComponentProps<typeof Screen>;

export function Grade3Screen(props: Grade3ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <Screen
      {...props}
      backgroundColor="#FFF8E9"
      contentPaddingTop={props.contentPaddingTop ?? insets.top + spacing.xl}
      gradeBand="elementary"
      keyboardAvoiding
    />
  );
}
