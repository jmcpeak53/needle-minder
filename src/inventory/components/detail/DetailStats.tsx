import { StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "../../../ui/theme";

type Props = {
  inStash: number;
  reserved: number;
};

export function DetailStats({ inStash, reserved }: Props) {
  const net = inStash - reserved;
  const shortValue = net < 0 ? net : 0;
  const isShort = shortValue < 0;

  return (
    <View style={styles.card}>
      <Stat label="IN STASH" value={inStash} />
      <View style={styles.divider} />
      <Stat label="RESERVED" value={reserved} />
      <View style={styles.divider} />
      <Stat label="SHORT" value={shortValue} warn={isShort} />
    </View>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, warn && styles.valueWarn]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md
  },
  stat: {
    flex: 1,
    alignItems: "center"
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.ruleSoft
  },
  value: {
    fontFamily: font.serif,
    fontSize: 26,
    color: colors.ink,
    lineHeight: 28
  },
  valueWarn: {
    color: colors.accent
  },
  label: {
    fontFamily: font.sans,
    fontSize: 10,
    color: colors.ink3,
    letterSpacing: 1.1,
    marginTop: 4
  }
});
