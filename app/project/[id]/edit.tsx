import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProjectForm } from "../../../src/projects/components/ProjectForm";
import { useProjects } from "../../../src/state/ProjectsContext";
import { colors, font, spacing } from "../../../src/ui/theme";

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { projects, updateProject } = useProjects();

  const project = projects.find((item) => item.id === id) ?? null;

  if (!project) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Project not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Edit project</Text>
        <View style={styles.appbarSpacer} />
      </View>

      <ProjectForm
        initialProject={project}
        submitLabel="Save changes"
        onSubmit={async (input) => {
          await updateProject(project.id, input);
          router.replace(`/project/${project.id}`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg
  },
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md
  },
  back: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.ink2
  },
  title: {
    fontFamily: font.serif,
    fontSize: 24,
    color: colors.ink
  },
  appbarSpacer: {
    width: 40
  }
});
