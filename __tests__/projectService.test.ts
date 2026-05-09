import { ProjectService } from "../src/projects/projectService";
import type { ProjectRepository, SaveProjectInput } from "../src/projects/projectRepository";
import type { InventoryConsumption, Project, ProjectReservationRecord } from "../src/projects/types";
import type { InventoryItem } from "../src/types";

const sampleProject: Project = {
  id: "project-1",
  folder: "Holiday",
  name: "Winter Sampler",
  author: "Acme",
  canvasMesh: null,
  status: "wip",
  startDate: "2026-05-01",
  completedDate: null,
  imageUri: null,
  notes: null,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z"
};

const sampleReservation: ProjectReservationRecord = {
  id: "reservation-1",
  projectId: "project-1",
  referenceColorId: "dmc-310",
  quantity: 2,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z",
  project: sampleProject,
  referenceColor: {
    id: "dmc-310",
    threadTypeId: "dmc-six-strand",
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and White",
    hexRgb: "#000000",
    isVariegated: false,
    threadSubtype: "solid",
    upc: null
  }
};

function createInventoryItem(id: string, quantity: number, condition: "full" | "partial"): InventoryItem {
  return {
    id,
    quantity,
    condition,
    notes: null,
    updatedAt: "2026-05-01T00:00:00.000Z",
    referenceColor: sampleReservation.referenceColor
  };
}

function createRepository(overrides: Partial<ProjectRepository> = {}): ProjectRepository {
  return {
    listProjects: jest.fn(async () => [sampleProject]),
    findProjectById: jest.fn(async () => sampleProject),
    createProject: jest.fn(async () => "project-1"),
    updateProject: jest.fn(async () => undefined),
    completeProject: jest.fn(async () => undefined),
    listReservations: jest.fn(async () => [sampleReservation]),
    listReservationsByProjectId: jest.fn(async () => [sampleReservation]),
    listReservationsByReferenceColorId: jest.fn(async () => [sampleReservation]),
    listInventoryByReferenceColorId: jest.fn(async () => [createInventoryItem("inv-full", 2, "full")]),
    setReservation: jest.fn(async () => undefined),
    removeReservation: jest.fn(async () => undefined),
    clearReservations: jest.fn(async () => undefined),
    ...overrides
  };
}

describe("ProjectService", () => {
  it("defaults the start date when creating a WIP project", async () => {
    const repository = createRepository();
    const service = new ProjectService(repository);

    await service.createProject({
      folder: null,
      name: "  New sampler  ",
      author: null,
      canvasMesh: null,
      status: "wip",
      startDate: null,
      completedDate: null,
      imageUri: null,
      notes: "  note  "
    });

    expect(repository.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New sampler",
        notes: "note",
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      })
    );
  });

  it("rejects a completed date before the start date", async () => {
    const repository = createRepository();
    const service = new ProjectService(repository);

    await expect(
      service.createProject({
        folder: null,
        name: "Sampler",
        author: null,
        canvasMesh: null,
        status: "finished",
        startDate: "2026-05-10",
        completedDate: "2026-05-09",
        imageUri: null,
        notes: null
      })
    ).rejects.toThrow("Completed date cannot be before the start date.");
  });

  it("blocks finishing a project when stash cannot cover its reserved skeins", async () => {
    const repository = createRepository({
      listInventoryByReferenceColorId: jest.fn(async () => [createInventoryItem("inv-1", 1, "full")])
    });
    const service = new ProjectService(repository);

    await expect(
      service.updateProject("project-1", {
        ...baseInput(),
        status: "finished"
      })
    ).rejects.toThrow("Not enough skeins in stash to finish this project.");

    expect(repository.completeProject).not.toHaveBeenCalled();
  });

  it("consumes partial skeins before full skeins when finishing a project", async () => {
    const repository = createRepository({
      listInventoryByReferenceColorId: jest.fn(async () => [
        createInventoryItem("partial-1", 1, "partial"),
        createInventoryItem("full-1", 2, "full")
      ])
    });
    const service = new ProjectService(repository);

    await service.updateProject("project-1", {
      ...baseInput(),
      status: "finished"
    });

    expect(repository.completeProject).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({ status: "finished" }),
      [
        { inventoryId: "partial-1", nextQuantity: 0, remove: true },
        { inventoryId: "full-1", nextQuantity: 1, remove: false }
      ] satisfies InventoryConsumption[]
    );
  });
});

function baseInput(): SaveProjectInput {
  return {
    folder: sampleProject.folder,
    name: sampleProject.name,
    author: sampleProject.author,
    canvasMesh: sampleProject.canvasMesh,
    status: sampleProject.status,
    startDate: sampleProject.startDate,
    completedDate: sampleProject.completedDate,
    imageUri: sampleProject.imageUri,
    notes: sampleProject.notes
  };
}
