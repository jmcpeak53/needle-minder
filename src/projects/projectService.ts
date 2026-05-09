import {
  createInventoryConsumptionPlan,
  isActiveProjectStatus
} from "./projectMath";
import type { ProjectRepository, SaveProjectInput } from "./projectRepository";
import type { ProjectStatus } from "./types";

const MAX_NOTES_LENGTH = 255;

export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  async listProjects() {
    return this.repository.listProjects();
  }

  async findProjectById(id: string) {
    return this.repository.findProjectById(id);
  }

  async listReservations() {
    return this.repository.listReservations();
  }

  async listReservationsByProjectId(projectId: string) {
    return this.repository.listReservationsByProjectId(projectId);
  }

  async listReservationsByReferenceColorId(referenceColorId: string) {
    return this.repository.listReservationsByReferenceColorId(referenceColorId);
  }

  async createProject(input: SaveProjectInput): Promise<string> {
    const normalized = normalizeProjectInput(input);
    return this.repository.createProject(applyStatusDateDefaults(normalized));
  }

  async updateProject(id: string, input: SaveProjectInput): Promise<void> {
    const current = await this.repository.findProjectById(id);
    if (!current) {
      throw new Error("Project not found.");
    }

    if (current.status === "finished" && input.status !== "finished") {
      throw new Error("Finished projects cannot be reopened in this version.");
    }

    const normalized = applyStatusDateDefaults(normalizeProjectInput(input), current.status);

    if (normalized.status === "finished" && current.status !== "finished") {
      const reservations = await this.repository.listReservationsByProjectId(id);
      const allocations = [];

      for (const reservation of reservations) {
        const inventory = await this.repository.listInventoryByReferenceColorId(reservation.referenceColorId);
        allocations.push(...createInventoryConsumptionPlan(inventory, reservation.quantity));
      }

      await this.repository.completeProject(id, normalized, allocations);
      return;
    }

    await this.repository.updateProject(id, normalized);
  }

  async setReservation(projectId: string, referenceColorId: string, quantity: number): Promise<void> {
    assertPositiveQuantity(quantity);
    await this.repository.setReservation(projectId, referenceColorId, quantity);
  }

  async removeReservation(projectId: string, referenceColorId: string): Promise<void> {
    await this.repository.removeReservation(projectId, referenceColorId);
  }

  async clearReservations(projectId: string): Promise<void> {
    await this.repository.clearReservations(projectId);
  }
}

function normalizeProjectInput(input: SaveProjectInput): SaveProjectInput {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Project name is required.");
  }

  const notes = input.notes?.trim() ?? null;
  if (notes && notes.length > MAX_NOTES_LENGTH) {
    throw new Error(`Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`);
  }

  const folder = normalizeOptionalText(input.folder);
  const author = normalizeOptionalText(input.author);
  const imageUri = normalizeOptionalText(input.imageUri);
  const startDate = normalizeOptionalDate(input.startDate);
  const completedDate = normalizeOptionalDate(input.completedDate);

  if (completedDate && startDate && completedDate < startDate) {
    throw new Error("Completed date cannot be before the start date.");
  }

  return {
    ...input,
    folder,
    name,
    author,
    imageUri,
    notes,
    startDate,
    completedDate
  };
}

function applyStatusDateDefaults(
  input: SaveProjectInput,
  previousStatus: ProjectStatus | null = null
): SaveProjectInput {
  const today = new Date().toISOString().slice(0, 10);
  const next = { ...input };

  if (next.status === "wip" && !next.startDate) {
    next.startDate = today;
  }

  if (next.status === "finished") {
    if (!next.startDate) {
      next.startDate = today;
    }
    if (!next.completedDate) {
      next.completedDate = today;
    }
  } else if (previousStatus === "finished" && isActiveProjectStatus(next.status)) {
    next.completedDate = null;
  } else if (input.completedDate === null) {
    next.completedDate = null;
  }

  if (next.completedDate && next.startDate && next.completedDate < next.startDate) {
    throw new Error("Completed date cannot be before the start date.");
  }

  return next;
}

function assertPositiveQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
