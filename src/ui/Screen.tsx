import { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";

import { colors, spacing } from "./theme";

export function Screen({ children }: PropsWithChildren) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>{children}</View>
    </ScrollView>
  );
}
