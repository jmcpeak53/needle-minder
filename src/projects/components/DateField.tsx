import { useMemo, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "../../ui/theme";

type DateFieldProps = {
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DateField({ value, onChange, placeholder = "Pick a date" }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | null>(null);

  const selectedDate = useMemo(() => parseIsoDate(value) ?? new Date(), [value]);
  const pickerDate = draftDate ?? selectedDate;
  const label = value ? formatDateLabel(value) : placeholder;

  const openPicker = () => {
    setDraftDate(selectedDate);
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
    setDraftDate(null);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    setOpen(false);
    setDraftDate(null);

    if (event.type === "set" && nextDate) {
      onChange(dateToIsoDate(nextDate));
    }
  };

  const handleIosChange = (_event: DateTimePickerEvent, nextDate?: Date) => {
    if (nextDate) {
      setDraftDate(nextDate);
    }
  };

  const confirmIosDate = () => {
    onChange(dateToIsoDate(pickerDate));
    closePicker();
  };

  const clearDate = () => {
    onChange(null);
    closePicker();
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        style={({ pressed }) => [styles.input, pressed && styles.inputPressed]}
      >
        <Text style={[styles.valueText, !value && styles.placeholderText]}>{label}</Text>
      </Pressable>

      {value ? (
        <Pressable accessibilityRole="button" onPress={clearDate} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      ) : null}

      {open && Platform.OS === "android" ? (
        <DateTimePicker mode="date" value={pickerDate} onChange={handleAndroidChange} />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal animationType="fade" transparent visible={open} onRequestClose={closePicker}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Pressable accessibilityRole="button" onPress={closePicker} style={styles.modalAction}>
                  <Text style={styles.modalActionText}>Cancel</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={confirmIosDate} style={styles.modalAction}>
                  <Text style={[styles.modalActionText, styles.doneText]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker display="spinner" mode="date" value={pickerDate} onChange={handleIosChange} />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function parseIsoDate(value: string | null): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function formatDateLabel(value: string): string {
  const date = parseIsoDate(value);
  if (!date) {
    return value;
  }

  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function dateToIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inputPressed: {
    borderColor: colors.ink4
  },
  valueText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink
  },
  placeholderText: {
    color: colors.ink4
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 12
  },
  clearText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.ink3
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(29, 26, 22, 0.3)"
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  modalAction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  modalActionText: {
    fontFamily: font.sansMedium,
    fontSize: 14,
    color: colors.ink3
  },
  doneText: {
    color: colors.accent
  }
});
