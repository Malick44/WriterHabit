import { Screen } from "@/shared/components";
import { spacing } from "@/design/tokens";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { grade3Theme } from "../theme/grade3Theme";

type Grade3ScreenProps = ComponentProps<typeof Screen>;

export function Grade3Screen(props: Grade3ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <Screen
      {...props}
      backgroundColor={grade3Theme.screen.background}
      contentPaddingTop={props.contentPaddingTop ?? insets.top + spacing.xl}
      gradeBand="elementary"
      keyboardAvoiding
    />
  );
}
