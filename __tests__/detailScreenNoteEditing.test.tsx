import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import DetailScreen from "../app/detail/[id]";

const mockUpdateInventory = jest.fn();
const mockDecrementInventory = jest.fn();
const mockToggleFavorite = jest.fn();
const mockRemoveInventory = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

const sampleItem = {
  id: "inv-1",
  updatedAt: "2025-01-01T00:00:00.000Z",
  referenceColor: {
    id: "color-310",
    threadTypeId: "dmc-six-strand",
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and Gray",
    hexRgb: "#000000",
    isVariegated: false,
    threadSubtype: "solid",
    upc: null
  },
  quantity: 2,
  condition: "full" as const,
  favorite: false,
  notes: "Existing note"
};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "inv-1" }),
  useRouter: () => ({ back: mockBack, push: mockPush })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons"
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}));

jest.mock("../src/state/InventoryContext", () => ({
  useInventory: () => ({
    inventory: [sampleItem],
    decrementInventory: mockDecrementInventory,
    updateInventory: mockUpdateInventory,
    toggleFavorite: mockToggleFavorite,
    removeInventory: mockRemoveInventory
  })
}));

jest.mock("../src/state/ProjectsContext", () => ({
  useProjects: () => ({
    getReservationsByReferenceColor: () => []
  })
}));

jest.mock("../src/state/CatalogContext", () => ({
  useCatalog: () => ({
    getThreadTypeDisplayName: () => "DMC Six-Strand"
  })
}));

describe("DetailScreen notes editing", () => {
  beforeEach(() => {
    mockUpdateInventory.mockClear();
    mockDecrementInventory.mockClear();
    mockToggleFavorite.mockClear();
    mockRemoveInventory.mockClear();
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it("saves note changes when the notes field loses focus", async () => {
    const { getByPlaceholderText, getByTestId } = render(<DetailScreen />);

    const input = getByPlaceholderText("Notes about this skein...");

    expect(getByTestId("detail-keyboard-body")).toBeTruthy();
    expect(getByTestId("detail-keyboard-scroll")).toBeTruthy();

    fireEvent.changeText(input, "  Updated note  ");
    fireEvent(input, "blur");

    await waitFor(() => {
      expect(mockUpdateInventory).toHaveBeenCalledWith("inv-1", { notes: "  Updated note  " });
    });
  });
});
