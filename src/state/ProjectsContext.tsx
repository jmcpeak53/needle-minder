import { createContext, useContext } from "react";

import type { SaveProjectInput } from "../projects/projectRepository";
import type {
  Project,
  ProjectDetail,
  ProjectLookupReservation,
  ProjectSummary,
  ShoppingShortfall
} from "../projects/types";

export type ProjectsContextValue = {
  ready: boolean;
  projects: Project[];
  projectSummaries: ProjectSummary[];
  shoppingShortfalls: ShoppingShortfall[];
  createProject(input: SaveProjectInput): Promise<string>;
  updateProject(id: string, input: SaveProjectInput): Promise<void>;
  setProjectReservation(projectId: string, referenceColorId: string, quantity: number): Promise<void>;
  removeProjectReservation(projectId: string, referenceColorId: string): Promise<void>;
  clearProjectReservations(projectId: string): Promise<void>;
  getProjectDetail(projectId: string): ProjectDetail | null;
  getReservationsByReferenceColor(referenceColorId: string): ProjectLookupReservation[];
};

export const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function useProjects(): ProjectsContextValue {
  const value = useContext(ProjectsContext);
  if (!value) {
    throw new Error("useProjects must be used within NeedleMinderProvider.");
  }
  return value;
}
