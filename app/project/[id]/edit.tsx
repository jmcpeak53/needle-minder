import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProjectForm } from "../../../src/projects/components/ProjectForm";
import { useProjects } from "../../../src/state/ProjectsContext";
import { KeyboardAwareFormScreen } from "../../../src/ui/KeyboardAwareFormScreen";
import { colors, font } from "../../../src/ui/theme";

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
    <KeyboardAwareFormScreen title="Edit project" onBackPress={() => router.back()}>
      <ProjectForm
        initialProject={project}
        submitLabel="Save changes"
        onSubmit={async (input) => {
          await updateProject(project.id, input);
          router.replace(`/project/${project.id}`);
        }}
      />
    </KeyboardAwareFormScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  title: {
    fontFamily: font.serif,
    fontSize: 24,
    color: colors.ink
  }
});
