import { StyleSheet, View } from "react-native";

type Props = {
  color: string;
  size?: number;
};

/**
 * Circular thread skein ball with a subtle 3-D illusion:
 *   - base fill = thread color
 *   - small white ellipse in top-left corner simulates a highlight
 *   - dark translucent ellipse bottom-right simulates shadow depth
 */
export function SkeinBall({ color, size = 44 }: Props) {
  const r = size / 2;
  return (
    <View
      style={[
        styles.ball,
        {
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: color
        }
      ]}
    >
      {/* highlight */}
      <View
        style={[
          styles.highlight,
          {
            width: size * 0.42,
            height: size * 0.3,
            borderRadius: size * 0.15,
            top: size * 0.12,
            left: size * 0.14
          }
        ]}
      />
      {/* shadow */}
      <View
        style={[
          styles.shadow,
          {
            width: size * 0.5,
            height: size * 0.36,
            borderRadius: size * 0.18,
            bottom: size * 0.1,
            right: size * 0.08
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ball: {
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
  }
});
