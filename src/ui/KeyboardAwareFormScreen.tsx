import type { PropsWithChildren, ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareBody } from "./KeyboardAwareBody";
import { colors, font, spacing } from "./theme";

type Props = PropsWithChildren<{
  title: string;
  onBackPress: () => void;
  headerRight?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function KeyboardAwareFormScreen({
  title,
  onBackPress,
  headerRight,
  contentContainerStyle,
  children
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.appbar}>
          <View style={styles.headerSide}>
            <Pressable onPress={onBackPress}>
              <Text style={styles.back}>Back</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{title}</Text>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            {headerRight ?? <View style={styles.headerSpacer} />}
          </View>
        </View>

        <KeyboardAwareBody
          testID="keyboard-aware-form-screen"
          scrollTestID="keyboard-aware-form-scroll"
          contentContainerStyle={[styles.content, contentContainerStyle]}
        >
          {children}
        </KeyboardAwareBody>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  safeArea: {
    flex: 1
  },
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  headerSide: {
    width: 56,
    justifyContent: "center"
  },
  headerSideRight: {
    alignItems: "flex-end"
  },
  headerSpacer: {
    width: 1,
    height: 1
  },
  back: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.ink2
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: font.serif,
    fontSize: 24,
    color: colors.ink
  },
  content: {
    paddingHorizontal: spacing.lg
  }
});
