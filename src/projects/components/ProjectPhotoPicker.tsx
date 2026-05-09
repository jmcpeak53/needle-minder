import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ProjectImagePlaceholder } from "./ProjectImagePlaceholder";
import { useProjectPhoto } from "./useProjectPhoto";
import { colors, font, radius, spacing } from "../../ui/theme";

type Props = {
  imageUri: string;
  onImageChange(uri: string): void;
};

export function ProjectPhotoPicker({ imageUri, onImageChange }: Props) {
  const { cameraOpen, cameraRef, openCamera, closeCamera, capture } = useProjectPhoto();

  const handleCapture = async () => {
    const uri = await capture();
    if (uri) {
      onImageChange(uri);
      closeCamera();
    }
  };

  return (
    <>
      <View style={styles.imageSection}>
        <View style={styles.heroCard}>
          <ProjectImagePlaceholder imageUri={imageUri || null} rounded={radius.xl} />
        </View>
        <View style={styles.imageActions}>
          <Pressable style={[styles.imageButton, styles.imageButtonPrimary]} onPress={openCamera}>
            <Ionicons name="camera-outline" size={16} color={colors.card} />
            <Text style={styles.imageButtonPrimaryText}>{imageUri ? "Retake photo" : "Take photo"}</Text>
          </Pressable>
          {imageUri ? (
            <Pressable style={styles.imageButton} onPress={() => onImageChange("")}>
              <Ionicons name="trash-outline" size={16} color={colors.ink2} />
              <Text style={styles.imageButtonText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Modal visible={cameraOpen} animationType="slide" onRequestClose={closeCamera}>
        <View style={styles.cameraScreen}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <View style={styles.cameraToolbar}>
            <Pressable style={styles.cameraBtn} onPress={closeCamera}>
              <Ionicons name="close" size={22} color={colors.card} />
            </Pressable>
            <Pressable style={styles.captureBtn} onPress={handleCapture}>
              <View style={styles.captureInner} />
            </Pressable>
            <View style={styles.cameraBtnSpacer} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  imageSection: {
    gap: spacing.sm
  },
  heroCard: {
    height: 220,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.xl,
    overflow: "hidden"
  },
  imageActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  imageButtonPrimary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    flex: 1
  },
  imageButtonText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.ink
  },
  imageButtonPrimaryText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.card
  },
  cameraScreen: {
    flex: 1,
    backgroundColor: "#000"
  },
  camera: {
    flex: 1
  },
  cameraToolbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(29,26,22,0.45)"
  },
  cameraBtnSpacer: {
    width: 44,
    height: 44
  },
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.card
  }
});
