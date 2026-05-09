import type { InventoryItem } from "../types";
import type {
  InventoryAllocationCandidate,
  InventoryConsumption,
  Project,
  ProjectDetail,
  ProjectLookupReservation,
  ProjectReservationDetail,
  ProjectReservationRecord,
  ProjectStatus,
  ProjectSummary,
  ShoppingShortfall
} from "./types";

type ColorAvailability = {
  physicalStash: number;
  reserved: number;
  available: number;
  shortfall: number;
};

export function isActiveProjectStatus(status: ProjectStatus): boolean {
  return status !== "finished";
}

export function getProjectStatusLabel(status: ProjectStatus): string {
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

export function calculateDaysInWip(project: Project, now = new Date()): number | null {
  if (project.status !== "wip" || !project.startDate) {
    return null;
  }

  const start = new Date(project.startDate);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(start).getTime()) / msPerDay));
}

export function buildProjectSummaries(
  projects: Project[],
  reservations: ProjectReservationRecord[],
  inventory: InventoryItem[]
): ProjectSummary[] {
  const availabilityByColor = buildAvailabilityByColor(reservations, inventory);
  const reservationsByProject = groupReservationsByProject(reservations);

  return projects
    .map((project) =>
      buildProjectSummary(project, reservationsByProject.get(project.id) ?? [], availabilityByColor)
    )
    .sort(compareProjectSummaries);
}

export function buildProjectDetail(
  project: Project,
  reservations: ProjectReservationRecord[],
  inventory: InventoryItem[]
): ProjectDetail {
  const availabilityByColor = buildAvailabilityByColor(reservations, inventory);
  return buildProjectSummary(project, reservations.filter((r) => r.projectId === project.id), availabilityByColor);
}

export function buildShoppingShortfalls(
  reservations: ProjectReservationRecord[],
  inventory: InventoryItem[]
): ShoppingShortfall[] {
  const availabilityByColor = buildAvailabilityByColor(reservations, inventory);
  const grouped = new Map<string, ProjectReservationRecord[]>();

  for (const reservation of reservations) {
    if (!isActiveProjectStatus(reservation.project.status)) {
      continue;
    }

    const shortfall = availabilityByColor.get(reservation.referenceColorId)?.shortfall ?? 0;
    if (shortfall < 1) {
      continue;
    }

    const list = grouped.get(reservation.referenceColorId) ?? [];
    list.push(reservation);
    grouped.set(reservation.referenceColorId, list);
  }

  return Array.from(grouped.values())
    .map((items) => {
      const first = items[0];
      const availability = availabilityByColor.get(first.referenceColorId) ?? emptyAvailability();

      return {
        referenceColor: first.referenceColor,
        physicalStash: availability.physicalStash,
        reserved: availability.reserved,
        available: availability.available,
        stillNeed: availability.shortfall,
        missingQuantity: availability.shortfall,
        projects: items.map((item) => ({
          project: item.project,
          quantity: item.quantity,
          missingQuantity: Math.min(item.quantity, availability.shortfall)
        }))
      };
    })
    .sort((a, b) => {
      if (b.missingQuantity !== a.missingQuantity) {
        return b.missingQuantity - a.missingQuantity;
      }

      return a.referenceColor.colorCode.localeCompare(b.referenceColor.colorCode);
    });
}

export function buildProjectReverseLookup(
  referenceColorId: string,
  reservations: ProjectReservationRecord[],
  inventory: InventoryItem[]
): ProjectLookupReservation[] {
  const availabilityByColor = buildAvailabilityByColor(reservations, inventory);
  const availability = availabilityByColor.get(referenceColorId) ?? emptyAvailability();

  return reservations
    .filter((reservation) => reservation.referenceColorId === referenceColorId)
    .map((reservation) => ({
      project: reservation.project,
      referenceColor: reservation.referenceColor,
      quantity: reservation.quantity,
      physicalStash: availability.physicalStash,
      reserved: availability.reserved,
      available: availability.available,
      stillNeed: isActiveProjectStatus(reservation.project.status)
        ? Math.min(reservation.quantity, availability.shortfall)
        : 0
    }))
    .sort((a, b) => compareProjects(a.project, b.project));
}

export function createInventoryConsumptionPlan(
  inventory: InventoryAllocationCandidate[],
  neededQuantity: number
): InventoryConsumption[] {
  if (neededQuantity < 1) {
    return [];
  }

  const sorted = [...inventory].sort((a, b) => {
    if (a.condition !== b.condition) {
      return a.condition === "partial" ? -1 : 1;
    }

    return a.updatedAt.localeCompare(b.updatedAt);
  });

  const total = sorted.reduce((sum, item) => sum + item.quantity, 0);
  if (total < neededQuantity) {
    throw new Error("Not enough skeins in stash to finish this project.");
  }

  let remaining = neededQuantity;
  const plan: InventoryConsumption[] = [];

  for (const item of sorted) {
    if (remaining === 0) {
      break;
    }

    const consumed = Math.min(item.quantity, remaining);
    const nextQuantity = item.quantity - consumed;
    plan.push({
      inventoryId: item.id,
      nextQuantity,
      remove: nextQuantity === 0
    });
    remaining -= consumed;
  }

  return plan;
}

function buildProjectSummary(
  project: Project,
  reservations: ProjectReservationRecord[],
  availabilityByColor: Map<string, ColorAvailability>
): ProjectSummary {
  const reservationDetails = reservations
    .map((reservation) => buildReservationDetail(reservation, availabilityByColor))
    .sort((a, b) => a.referenceColor.colorCode.localeCompare(b.referenceColor.colorCode));

  const totalSkeins = reservationDetails.reduce((sum, reservation) => sum + reservation.quantity, 0);
  const missingColors = reservationDetails.filter((reservation) => reservation.stillNeed > 0).length;
  const shortfallSkeins = reservationDetails.reduce((sum, reservation) => sum + reservation.stillNeed, 0);

  return {
    project,
    reservations: reservationDetails,
    totalColors: reservationDetails.length,
    totalSkeins,
    readyColors: reservationDetails.length - missingColors,
    missingColors,
    shortfallSkeins,
    daysInWip: calculateDaysInWip(project)
  };
}

function buildReservationDetail(
  reservation: ProjectReservationRecord,
  availabilityByColor: Map<string, ColorAvailability>
): ProjectReservationDetail {
  const availability = availabilityByColor.get(reservation.referenceColorId) ?? emptyAvailability();
  const stillNeed = isActiveProjectStatus(reservation.project.status)
    ? Math.min(reservation.quantity, availability.shortfall)
    : 0;

  return {
    ...reservation,
    physicalStash: availability.physicalStash,
    reserved: availability.reserved,
    available: availability.available,
    stillNeed
  };
}

function buildAvailabilityByColor(
  reservations: ProjectReservationRecord[],
  inventory: InventoryItem[]
): Map<string, ColorAvailability> {
  const physicalByColor = new Map<string, number>();
  const reservedByColor = new Map<string, number>();

  for (const item of inventory) {
    physicalByColor.set(
      item.referenceColor.id,
      (physicalByColor.get(item.referenceColor.id) ?? 0) + item.quantity
    );
  }

  for (const reservation of reservations) {
    if (!isActiveProjectStatus(reservation.project.status)) {
      continue;
    }

    reservedByColor.set(
      reservation.referenceColorId,
      (reservedByColor.get(reservation.referenceColorId) ?? 0) + reservation.quantity
    );
  }

  const allColorIds = new Set<string>([
    ...Array.from(physicalByColor.keys()),
    ...Array.from(reservedByColor.keys())
  ]);

  const availability = new Map<string, ColorAvailability>();
  for (const colorId of allColorIds) {
    const physicalStash = physicalByColor.get(colorId) ?? 0;
    const reserved = reservedByColor.get(colorId) ?? 0;
    const availableCount = physicalStash - reserved;
    availability.set(colorId, {
      physicalStash,
      reserved,
      available: availableCount,
      shortfall: Math.max(0, reserved - physicalStash)
    });
  }

  return availability;
}

function groupReservationsByProject(
  reservations: ProjectReservationRecord[]
): Map<string, ProjectReservationRecord[]> {
  const grouped = new Map<string, ProjectReservationRecord[]>();

  for (const reservation of reservations) {
    const list = grouped.get(reservation.projectId) ?? [];
    list.push(reservation);
    grouped.set(reservation.projectId, list);
  }

  return grouped;
}

function compareProjectSummaries(a: ProjectSummary, b: ProjectSummary): number {
  const statusRankDiff = statusRank(a.project.status) - statusRank(b.project.status);
  if (statusRankDiff !== 0) {
    return statusRankDiff;
  }

  return compareProjects(a.project, b.project);
}

function compareProjects(a: Project, b: Project): number {
  const aDate = a.startDate ?? a.updatedAt;
  const bDate = b.startDate ?? b.updatedAt;
  if (aDate !== bDate) {
    return bDate.localeCompare(aDate);
  }

  return a.name.localeCompare(b.name);
}

function statusRank(status: ProjectStatus): number {
  switch (status) {
    case "wip":
      return 0;
    case "pattern":
      return 1;
    case "not_started":
      return 2;
    case "finished":
      return 3;
  }
}

function emptyAvailability(): ColorAvailability {
  return {
    physicalStash: 0,
    reserved: 0,
    available: 0,
    shortfall: 0
  };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
