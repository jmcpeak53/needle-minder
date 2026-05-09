import type { InventoryItem, ReferenceColor } from "../types";

export type ProjectStatus = "not_started" | "pattern" | "wip" | "finished";
export type ProjectCanvasMesh = 13 | 18;

export type Project = {
  id: string;
  folder: string | null;
  name: string;
  author: string | null;
  canvasMesh: ProjectCanvasMesh | null;
  status: ProjectStatus;
  startDate: string | null;
  completedDate: string | null;
  imageUri: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectReservation = {
  id: string;
  projectId: string;
  referenceColorId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectReservationRecord = ProjectReservation & {
  project: Project;
  referenceColor: ReferenceColor;
};

export type ReservationAvailability = {
  physicalStash: number;
  reserved: number;
  available: number;
  stillNeed: number;
};

export type ProjectReservationDetail = ProjectReservationRecord & ReservationAvailability;

export type ProjectSummary = {
  project: Project;
  reservations: ProjectReservationDetail[];
  totalColors: number;
  totalSkeins: number;
  readyColors: number;
  missingColors: number;
  shortfallSkeins: number;
  daysInWip: number | null;
};

export type ProjectDetail = ProjectSummary;

export type ProjectLookupReservation = ReservationAvailability & {
  project: Project;
  quantity: number;
  referenceColor: ReferenceColor;
};

export type ShoppingShortfall = ReservationAvailability & {
  referenceColor: ReferenceColor;
  missingQuantity: number;
  projects: {
    project: Project;
    quantity: number;
    missingQuantity: number;
  }[];
};

export type InventoryConsumption = {
  inventoryId: string;
  nextQuantity: number;
  remove: boolean;
};

export type InventoryAllocationCandidate = Pick<InventoryItem, "id" | "quantity" | "condition" | "updatedAt">;
