import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font, NAV_HEIGHT, spacing } from "../../src/ui/theme";

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Projects</Text>
      <Text style={styles.body}>Project tracking is coming in a future version.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: NAV_HEIGHT },
  title: { fontFamily: font.serif, fontSize: 28, color: colors.ink, paddingTop: spacing.lg, marginBottom: spacing.sm },
  body: { fontFamily: font.sans, fontSize: 14, color: colors.ink3 }
});
