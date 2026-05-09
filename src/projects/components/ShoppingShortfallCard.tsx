import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ShoppingShortfall } from "../types";
import { colors, font, radius, spacing } from "../../ui/theme";

export function ShoppingShortfallCard({
  item,
  onPress
}: {
  item: ShoppingShortfall;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.body}>
      <View style={styles.head}>
        <View style={styles.meta}>
          <Text style={styles.name}>{item.referenceColor.colorName}</Text>
          <Text style={styles.sub}>
            {item.referenceColor.colorCode} · {item.referenceColor.colorFamily}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeValue}>{item.missingQuantity}</Text>
          <Text style={styles.badgeLabel}>still need</Text>
        </View>
      </View>

      <Text style={styles.summary}>
        In stash {item.physicalStash} · Reserved {item.reserved} · Available {item.available}
      </Text>

      <View style={styles.tags}>
        {item.projects.map(({ project, quantity, missingQuantity }) => (
          <View key={project.id} style={styles.tag}>
            <Text style={styles.tagName} numberOfLines={1}>
              {project.name}
            </Text>
            <Text style={styles.tagMeta}>
              Need {quantity} · Still need {missingQuantity}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (!onPress) {
    return <View style={styles.card}>{body}</View>;
  }

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.lg
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm
  },
  head: {
    flexDirection: "row",
    gap: spacing.md
  },
  meta: {
    flex: 1
  },
  name: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  sub: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2
  },
  badge: {
    backgroundColor: colors.accentTint,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 84,
    alignItems: "center"
  },
  badgeValue: {
    fontFamily: font.serif,
    fontSize: 24,
    color: colors.accent,
    lineHeight: 24
  },
  badgeLabel: {
    fontFamily: font.sans,
    fontSize: 10,
    color: colors.accent
  },
  summary: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3
  },
  tags: {
    gap: 8
  },
  tag: {
    backgroundColor: colors.card2,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  tagName: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: colors.ink
  },
  tagMeta: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2
  }
});
