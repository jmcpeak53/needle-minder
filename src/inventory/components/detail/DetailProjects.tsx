import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProjectStatusPill } from "../../../projects/components/ProjectStatusPill";
import type { ProjectLookupReservation } from "../../../projects/types";
import { colors, font, radius, spacing } from "../../../ui/theme";

type Props = {
  reservations: ProjectLookupReservation[];
  onOpenProject: (projectId: string) => void;
};

export function DetailProjects({ reservations, onOpenProject }: Props) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Projects</Text>
        <Text style={styles.sectionAction}>
          {reservations.length} reservation{reservations.length === 1 ? "" : "s"}
        </Text>
      </View>

      {reservations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No projects are reserving this color yet.</Text>
        </View>
      ) : (
        reservations.map((reservation) => (
          <Pressable
            key={reservation.project.id}
            onPress={() => onOpenProject(reservation.project.id)}
            style={styles.projectRow}
            testID={`detail-project-${reservation.project.id}`}
          >
            <View style={styles.projectMeta}>
              <Text style={styles.projectName}>{reservation.project.name}</Text>
              <Text style={styles.projectSub}>
                Need {reservation.quantity} · In stash {reservation.physicalStash} · Reserved {reservation.reserved}
              </Text>
              {reservation.stillNeed > 0 ? (
                <Text style={styles.projectWarn}>Still need {reservation.stillNeed}</Text>
              ) : null}
            </View>
            <View style={styles.projectRight}>
              <ProjectStatusPill status={reservation.project.status} />
            </View>
          </Pressable>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 8
  },
  sectionTitle: {
    fontFamily: font.serif,
    fontSize: 18,
    color: colors.ink
  },
  sectionAction: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 0.3
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  emptyCardText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink3
  },
  projectRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  projectMeta: {
    flex: 1
  },
  projectName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  projectSub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2
  },
  projectWarn: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: colors.accent,
    marginTop: 6
  },
  projectRight: {
    alignItems: "flex-end"
  }
});
