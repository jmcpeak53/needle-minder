import { useRouter } from "expo-router";

import { ProjectForm } from "../../src/projects/components/ProjectForm";
import { useProjects } from "../../src/state/ProjectsContext";
import { KeyboardAwareFormScreen } from "../../src/ui/KeyboardAwareFormScreen";

export default function NewProjectScreen() {
  const router = useRouter();
  const { createProject } = useProjects();

  return (
    <KeyboardAwareFormScreen title="New project" onBackPress={() => router.back()}>
      <ProjectForm
        submitLabel="Save project"
        onSubmit={async (input) => {
          const id = await createProject(input);
          router.replace(`/project/${id}`);
        }}
      />
    </KeyboardAwareFormScreen>
  );
}
