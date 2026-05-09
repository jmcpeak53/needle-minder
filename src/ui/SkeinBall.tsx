import { StyleSheet, Text, View } from "react-native";

import type { ThreadCondition } from "../types";
import { colors, font } from "./theme";

type Props = {
  color: string;
  size?: number;
  condition?: ThreadCondition;
  showConditionBadge?: boolean;
};

/**
 * Circular thread skein ball with a subtle 3-D illusion:
 *   - base fill = thread color
 *   - small white ellipse in top-left corner simulates a highlight
 *   - dark translucent ellipse bottom-right simulates shadow depth
 */
export function SkeinBall({ color, size = 44, condition, showConditionBadge = false }: Props) {
  const r = size / 2;
  const shouldShowConditionBadge = showConditionBadge && condition === "partial";
  const badgeSize = Math.max(16, Math.round(size * 0.32));
  const badgeInset = shouldShowConditionBadge ? Math.max(3, Math.round(size * 0.12)) : 0;
  return (
    <View
      testID="skein-container"
      style={[
        styles.container,
        {
          width: size + badgeInset,
          height: size + badgeInset,
          paddingLeft: badgeInset,
          paddingTop: badgeInset
        }
      ]}
    >
      <View
        style={[
          styles.ball,
          {
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: color,
            top: badgeInset,
            left: badgeInset
          }
        ]}
      />
      <View
        style={[
          styles.highlight,
          {
            width: size * 0.42,
            height: size * 0.3,
            borderRadius: size * 0.15,
            top: badgeInset + size * 0.12,
            left: badgeInset + size * 0.14
          }
        ]}
      />
      <View
        style={[
          styles.shadow,
          {
            width: size * 0.5,
            height: size * 0.36,
            borderRadius: size * 0.18,
            bottom: badgeInset + size * 0.1,
            right: badgeInset + size * 0.08
          }
        ]}
      />
      {shouldShowConditionBadge ? (
        <View
          testID="skein-condition-badge"
          style={[
            styles.conditionBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              top: 0,
              left: 0
            }
          ]}
        >
          <Text style={[styles.conditionBadgeText, { fontSize: Math.max(9, Math.round(size * 0.16)) }]}>P</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    flexShrink: 0
  },
  ball: {
    position: "absolute",
    overflow: "hidden",
    flexShrink: 0
  },
  highlight: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.32)",
    transform: [{ rotate: "-20deg" }]
  },
  shadow: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.18)",
    transform: [{ rotate: "-15deg" }]
  },
  conditionBadge: {
    position: "absolute",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  conditionBadgeText: {
    fontFamily: font.sansBold,
    color: colors.accent
  }
});
