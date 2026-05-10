import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import ProjectThreadsScreen from "../app/project/[id]/threads";

const mockBack = jest.fn();
const mockSetProjectReservation = jest.fn();
const mockRemoveProjectReservation = jest.fn();

const sampleThreadType = {
  id: "dmc-six-strand",
  displayName: "DMC Six-Strand Embroidery Floss",
  manufacturer: "DMC"
};

const sampleColors = [
  {
    id: "color-310",
    threadTypeId: "dmc-six-strand",
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and Gray",
    hexRgb: "#000000",
    isVariegated: false,
    threadSubtype: "solid" as const,
    upc: null
  },
  {
    id: "color-321",
    threadTypeId: "dmc-six-strand",
    colorCode: "321",
    colorName: "Red",
    colorFamily: "Red",
    hexRgb: "#c21807",
    isVariegated: false,
    threadSubtype: "solid" as const,
    upc: null
  }
];

const sampleDetail = {
  project: {
    id: "proj-1",
    name: "Autumn Garden",
    status: "not_started" as const
  },
  reservations: [
    {
      projectId: "proj-1",
      referenceColorId: "color-310",
      quantity: 2
    }
  ],
  totalColors: 1,
  totalSkeins: 2
};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "proj-1" }),
  useRouter: () => ({ back: mockBack })
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons"
}));

jest.mock("../src/state/CatalogContext", () => ({
  useCatalog: () => ({
    catalog: sampleColors,
    threadTypes: [sampleThreadType],
    defaultCatalogFilter: "all"
  })
}));

jest.mock("../src/state/InventoryContext", () => ({
  useInventory: () => ({
    inventory: sampleColors.map((color, index) => ({
      id: `inventory-${index}`,
      referenceColor: color,
      quantity: index + 1,
      condition: "full",
      favorite: false,
      notes: ""
    }))
  })
}));

jest.mock("../src/state/ProjectsContext", () => ({
  useProjects: () => ({
    getProjectDetail: () => sampleDetail,
    getReservationsByReferenceColor: () => [],
    setProjectReservation: mockSetProjectReservation,
    removeProjectReservation: mockRemoveProjectReservation
  })
}));

describe("ProjectThreadsScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockSetProjectReservation.mockClear();
    mockRemoveProjectReservation.mockClear();
  });

  it("clears the shared search query and restores visible rows", () => {
    const { getByPlaceholderText, getByTestId, getByText, queryByText, queryByTestId } = render(<ProjectThreadsScreen />);

    fireEvent.changeText(getByPlaceholderText("Search code, name, or family"), "zzzzz");

    expect(getByTestId("project-threads-search-clear-button")).toBeTruthy();
    expect(getByText("No colors found")).toBeTruthy();
    expect(queryByText("Black")).toBeNull();

    fireEvent.press(getByTestId("project-threads-search-clear-button"));

    expect(getByPlaceholderText("Search code, name, or family").props.value).toBe("");
    expect(queryByTestId("project-threads-search-clear-button")).toBeNull();
    expect(getByText("Black")).toBeTruthy();
  });
});
