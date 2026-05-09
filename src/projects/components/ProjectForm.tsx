import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { ProjectImagePlaceholder } from "./ProjectImagePlaceholder";
import type { SaveProjectInput } from "../projectRepository";
import type { Project, ProjectStatus } from "../types";
import { colors, font, radius, spacing } from "../../ui/theme";

const STATUS_OPTIONS: ProjectStatus[] = ["not_started", "pattern", "wip", "finished"];

type Props = {
  initialProject?: Project | null;
  submitLabel: string;
  onSubmit: (input: SaveProjectInput) => Promise<void>;
};

export function ProjectForm({ initialProject, submitLabel, onSubmit }: Props) {
  const [folder, setFolder] = useState(initialProject?.folder ?? "");
  const [name, setName] = useState(initialProject?.name ?? "");
  const [author, setAuthor] = useState(initialProject?.author ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status ?? "not_started");
  const [startDate, setStartDate] = useState(initialProject?.startDate ?? "");
  const [completedDate, setCompletedDate] = useState(initialProject?.completedDate ?? "");
  const [notes, setNotes] = useState(initialProject?.notes ?? "");
  const [imageUri, setImageUri] = useState(initialProject?.imageUri ?? "");
  const [saving, setSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const canEditStatus = initialProject?.status !== "finished";
  const notesCount = notes.length;
  const showStartDate = status === "wip" || status === "finished" || !!startDate;
  const showCompletedDate = status === "finished" || !!completedDate;

  const payload = useMemo<SaveProjectInput>(
    () => ({
      folder: folder.trim() || null,
      name,
      author: author.trim() || null,
      canvasMesh: null,
      status,
      startDate: startDate.trim() || null,
      completedDate: completedDate.trim() || null,
      imageUri: imageUri.trim() || null,
      notes
    }),
    [author, completedDate, folder, imageUri, name, notes, startDate, status]
  );

  const launchCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Camera access needed", "Enable camera access to save a project photo.");
        return;
      }
    }

    setCameraOpen(true);
  };

  const capturePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (!photo?.uri) {
      return;
    }

    setImageUri(photo.uri);
    setCameraOpen(false);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await onSubmit(payload);
    } catch (error) {
      Alert.alert("Could not save project", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          <View style={styles.heroCard}>
            <ProjectImagePlaceholder imageUri={imageUri || null} rounded={radius.xl} />
          </View>
          <View style={styles.imageActions}>
            <Pressable style={[styles.imageButton, styles.imageButtonPrimary]} onPress={launchCamera}>
              <Ionicons name="camera-outline" size={16} color={colors.card} />
              <Text style={styles.imageButtonPrimaryText}>{imageUri ? "Retake photo" : "Take photo"}</Text>
            </Pressable>
            {imageUri ? (
              <Pressable style={styles.imageButton} onPress={() => setImageUri("")}>
                <Ionicons name="trash-outline" size={16} color={colors.ink2} />
                <Text style={styles.imageButtonText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Field label="Project name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Sampler title"
            placeholderTextColor={colors.ink4}
            style={styles.input}
          />
        </Field>

        <Field label="Folder">
          <TextInput
            value={folder}
            onChangeText={setFolder}
            placeholder="Root"
            placeholderTextColor={colors.ink4}
            style={styles.input}
          />
        </Field>

        <Field label="Author">
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="Designer name"
            placeholderTextColor={colors.ink4}
            style={styles.input}
          />
        </Field>

        <Field label="Status">
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map((option) => {
              const active = status === option;
              const disabled = !canEditStatus && option !== "finished";
              return (
                <Pressable
                  key={option}
                  onPress={() => !disabled && setStatus(option)}
                  style={[styles.statusOption, active && styles.statusOptionActive, disabled && styles.statusOptionDisabled]}
                >
                  <Text style={[styles.statusOptionText, active && styles.statusOptionTextActive]}>
                    {statusLabel(option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {showStartDate ? (
          <Field label="Start date">
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.ink4}
              autoCapitalize="none"
              style={styles.input}
            />
          </Field>
        ) : null}

        {showCompletedDate ? (
          <Field label="Completed date">
            <TextInput
              value={completedDate}
              onChangeText={setCompletedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.ink4}
              autoCapitalize="none"
              style={styles.input}
            />
          </Field>
        ) : null}

        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Project notes, linen count, conversion reminders…"
            placeholderTextColor={colors.ink4}
            multiline
            textAlignVertical="top"
            maxLength={255}
            style={[styles.input, styles.notesInput]}
          />
          <Text style={[styles.counter, notesCount > 220 && styles.counterWarn]}>{notesCount}/255</Text>
        </Field>

        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        >
          {saving ? <ActivityIndicator color={colors.card} /> : <Text style={styles.submitText}>{submitLabel}</Text>}
        </Pressable>
      </ScrollView>

      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={styles.cameraScreen}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <View style={styles.cameraToolbar}>
            <Pressable style={styles.cameraBtn} onPress={() => setCameraOpen(false)}>
              <Ionicons name="close" size={22} color={colors.card} />
            </Pressable>
            <Pressable style={styles.captureBtn} onPress={capturePhoto}>
              <View style={styles.captureInner} />
            </Pressable>
            <View style={styles.cameraBtnSpacer} />
          </View>
        </View>
      </Modal>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function statusLabel(status: ProjectStatus): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "pattern":
      return "Pattern";
    case "wip":
      return "WIP";
    case "finished":
      return "Finished";
  }
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
    gap: spacing.md
  },
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
  field: {
    gap: 6
  },
  fieldLabel: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: colors.ink3,
    textTransform: "uppercase"
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink
  },
  notesInput: {
    minHeight: 110
  },
  counter: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink4,
    alignSelf: "flex-end"
  },
  counterWarn: {
    color: colors.accent
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  statusOption: {
    minWidth: "47%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  statusOptionActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  statusOptionDisabled: {
    opacity: 0.4
  },
  statusOptionText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.ink
  },
  statusOptionTextActive: {
    color: colors.card
  },
  submitButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitText: {
    fontFamily: font.sansBold,
    fontSize: 15,
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
