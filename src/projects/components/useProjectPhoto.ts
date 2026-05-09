import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

export function useProjectPhoto() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Camera access needed", "Enable camera access to save a project photo.");
        return;
      }
    }
    setCameraOpen(true);
  }, [permission, requestPermission]);

  const closeCamera = useCallback(() => setCameraOpen(false), []);

  const capture = useCallback(async (): Promise<string | null> => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    return photo?.uri ?? null;
  }, []);

  return { cameraOpen, cameraRef, openCamera, closeCamera, capture };
}
