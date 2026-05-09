import type { InventoryItem } from "../types";
import type {
  InventoryConsumption,
  Project,
  ProjectCanvasMesh,
  ProjectReservationRecord,
  ProjectStatus
} from "./types";

export type SaveProjectInput = {
  folder: string | null;
  name: string;
  author: string | null;
  canvasMesh: ProjectCanvasMesh | null;
  status: ProjectStatus;
  startDate: string | null;
  completedDate: string | null;
  imageUri: string | null;
  notes: string | null;
};

export interface ProjectRepository {
  listProjects(): Promise<Project[]>;
  findProjectById(id: string): Promise<Project | null>;
  createProject(input: SaveProjectInput): Promise<string>;
  updateProject(id: string, input: SaveProjectInput): Promise<void>;
  completeProject(id: string, input: SaveProjectInput, plan: InventoryConsumption[]): Promise<void>;
  listReservations(): Promise<ProjectReservationRecord[]>;
  listReservationsByProjectId(projectId: string): Promise<ProjectReservationRecord[]>;
  listReservationsByReferenceColorId(referenceColorId: string): Promise<ProjectReservationRecord[]>;
  listInventoryByReferenceColorId(referenceColorId: string): Promise<InventoryItem[]>;
  setReservation(projectId: string, referenceColorId: string, quantity: number): Promise<void>;
  removeReservation(projectId: string, referenceColorId: string): Promise<void>;
  clearReservations(projectId: string): Promise<void>;
}
