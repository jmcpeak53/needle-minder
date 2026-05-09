import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";

import { radius } from "../../ui/theme";

type Props = {
  imageUri?: string | null;
  rounded?: number;
};

export function ProjectImagePlaceholder({ imageUri, rounded = radius.lg }: Props) {
  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[styles.image, { borderRadius: rounded }]} />;
  }

  return (
    <View style={[styles.placeholder, { borderRadius: rounded }]}>
      <View style={styles.canvasRing} />
      <View style={styles.threadBlobA} />
      <View style={styles.threadBlobB} />
      <Ionicons name="git-commit-outline" size={22} color="rgba(250,246,236,0.85)" style={styles.needle} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%"
  },
  placeholder: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#c7b388",
    borderWidth: 1,
    borderColor: "rgba(29,26,22,0.06)"
  },
  canvasRing: {
    position: "absolute",
    right: -16,
    top: -16,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 20,
    borderColor: "rgba(250,246,236,0.18)"
  },
  threadBlobA: {
    position: "absolute",
    left: -8,
    bottom: -10,
    width: 120,
    height: 90,
    borderRadius: 50,
    backgroundColor: "rgba(90,122,74,0.55)"
  },
  threadBlobB: {
    position: "absolute",
    right: 14,
    bottom: 12,
    width: 72,
    height: 52,
    borderRadius: 40,
    backgroundColor: "rgba(180,71,46,0.45)"
  },
  needle: {
    position: "absolute",
    right: 18,
    top: 16,
    transform: [{ rotate: "-22deg" }]
  }
});
