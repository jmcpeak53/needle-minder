import {
  buildProjectReverseLookup,
  buildProjectSummaries,
  buildShoppingShortfalls
} from "../src/projects/projectMath";
import type { Project, ProjectReservationRecord } from "../src/projects/types";
import type { InventoryItem, ReferenceColor } from "../src/types";

const black: ReferenceColor = {
  id: "dmc-310",
  threadTypeId: "dmc-six-strand",
  colorCode: "310",
  colorName: "Black",
  colorFamily: "Black and White",
  hexRgb: "#000000",
  isVariegated: false,
  threadSubtype: "solid",
  upc: null
};

const red: ReferenceColor = {
  ...black,
  id: "dmc-321",
  colorCode: "321",
  colorName: "Red",
  colorFamily: "Red",
  hexRgb: "#c21807"
};

const activeProject: Project = {
  id: "project-1",
  folder: null,
  name: "Active",
  author: null,
  canvasMesh: null,
  status: "wip",
  startDate: "2026-05-01",
  completedDate: null,
  imageUri: null,
  notes: null,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-02T00:00:00.000Z"
};

const secondProject: Project = {
  ...activeProject,
  id: "project-2",
  name: "Second",
  status: "pattern"
};

const finishedProject: Project = {
  ...activeProject,
  id: "project-3",
  name: "Finished",
  status: "finished",
  completedDate: "2026-05-03"
};

function reservation(project: Project, referenceColor: ReferenceColor, quantity: number): ProjectReservationRecord {
  return {
    id: `${project.id}-${referenceColor.id}`,
    projectId: project.id,
    referenceColorId: referenceColor.id,
    quantity,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    project,
    referenceColor
  };
}

function inventory(referenceColor: ReferenceColor, quantity: number): InventoryItem {
  return {
    id: `inv-${referenceColor.id}`,
    quantity,
    condition: "full",
    notes: null,
    updatedAt: "2026-05-01T00:00:00.000Z",
    referenceColor
  };
}

describe("projectMath", () => {
  it("computes shortfalls using only active project reservations", () => {
    const summaries = buildProjectSummaries(
      [activeProject, secondProject, finishedProject],
      [
        reservation(activeProject, black, 2),
        reservation(secondProject, black, 1),
        reservation(finishedProject, black, 4),
        reservation(activeProject, red, 1)
      ],
      [inventory(black, 2), inventory(red, 1)]
    );

    const activeSummary = summaries.find((item) => item.project.id === activeProject.id)!;
    expect(activeSummary.shortfallSkeins).toBe(1);
    expect(activeSummary.missingColors).toBe(1);

    const finishedSummary = summaries.find((item) => item.project.id === finishedProject.id)!;
    expect(finishedSummary.shortfallSkeins).toBe(0);
  });

  it("builds one shopping row per shortfall color", () => {
    const shopping = buildShoppingShortfalls(
      [reservation(activeProject, black, 2), reservation(secondProject, black, 1), reservation(activeProject, red, 1)],
      [inventory(black, 2), inventory(red, 1)]
    );

    expect(shopping).toHaveLength(1);
    expect(shopping[0]).toEqual(
      expect.objectContaining({
        referenceColor: black,
        missingQuantity: 1
      })
    );
    expect(shopping[0].projects).toHaveLength(2);
  });

  it("returns reverse lookup rows for every reserving project", () => {
    const lookup = buildProjectReverseLookup(
      black.id,
      [reservation(activeProject, black, 2), reservation(secondProject, black, 1)],
      [inventory(black, 2)]
    );

    expect(lookup).toHaveLength(2);
    expect(lookup[0].referenceColor.id).toBe(black.id);
    expect(lookup[0].stillNeed).toBe(1);
  });
});
