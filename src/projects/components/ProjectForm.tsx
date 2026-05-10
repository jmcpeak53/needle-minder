import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { ProjectPhotoPicker } from "./ProjectPhotoPicker";
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
    <View style={styles.content}>
      <ProjectPhotoPicker imageUri={imageUri} onImageChange={setImageUri} />

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
    </View>
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
    gap: spacing.md
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
  }
});
