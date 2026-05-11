import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SkeinBall } from "../../../ui/SkeinBall";
import { ThreadConditionPill } from "../../../ui/ThreadConditionPill";
import { colors, font, spacing } from "../../../ui/theme";
import type { InventoryItem } from "../../../types";

type Props = {
  item: InventoryItem;
  threadTypeDisplayName: string;
  formattedUpdatedAt: string;
  onToggleFavorite: () => void;
};

export function DetailHero({ item, threadTypeDisplayName, formattedUpdatedAt, onToggleFavorite }: Props) {
  return (
    <View style={styles.hero}>
      <SkeinBall color={item.referenceColor.hexRgb} size={80} condition={item.condition} showConditionBadge />
      <View style={styles.info}>
        <Text style={styles.type}>{threadTypeDisplayName}</Text>
        <Text style={styles.meta}>
          Added {formattedUpdatedAt} · {item.referenceColor.colorFamily}
        </Text>
        <View style={styles.tags}>
          <View style={styles.code}>
            <Text style={styles.codeText}>{item.referenceColor.colorCode}</Text>
          </View>
          <ThreadConditionPill condition={item.condition} />
          <Pressable onPress={onToggleFavorite} hitSlop={8} testID="detail-favorite-toggle">
            <Ionicons
              name={item.favorite ? "star" : "star-outline"}
              size={16}
              color={item.favorite ? "#e6a817" : colors.ink3}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    paddingVertical: spacing.md
  },
  info: {
    flex: 1
  },
  type: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  meta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 3
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 6
  },
  code: {
    backgroundColor: colors.card2,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start"
  },
  codeText: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink3
  }
});
