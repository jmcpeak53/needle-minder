import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from "react-native";
import type { ScrollViewProps, StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "./theme";

type Props = PropsWithChildren<{
  contentBottomPadding?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardAreaStyle?: StyleProp<ViewStyle>;
  keyboardDismissMode?: ScrollViewProps["keyboardDismissMode"];
  scroll?: boolean;
  testID?: string;
  scrollTestID?: string;
  scrollViewProps?: Omit<ScrollViewProps, "contentContainerStyle" | "children">;
}>;

export function KeyboardAwareBody({
  children,
  contentBottomPadding = spacing.xl,
  contentContainerStyle,
  keyboardAreaStyle,
  keyboardDismissMode = "on-drag",
  scroll = true,
  testID,
  scrollTestID,
  scrollViewProps
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      testID={testID}
      style={[styles.keyboardArea, keyboardAreaStyle]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {scroll ? (
        <ScrollView
          testID={scrollTestID}
          contentContainerStyle={[{ paddingBottom: insets.bottom + contentBottomPadding }, contentContainerStyle]}
          keyboardDismissMode={keyboardDismissMode}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardArea: {
    flex: 1
  }
});
