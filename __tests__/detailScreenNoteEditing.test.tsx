import React from "react";
import { ScrollView } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import DetailScreen from "../app/detail/[id]";
import type { ProjectLookupReservation } from "../src/projects/types";
import type { InventoryItem } from "../src/types";

const mockUpdateInventory = jest.fn();
const mockSetConditionQuantity = jest.fn();
const mockToggleFavorite = jest.fn();
const mockRemoveInventory = jest.fn();
const mockDecrementInventory = jest.fn();
const mockAddInventory = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

const sampleItem: InventoryItem = {
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
  condition: "full",
  favorite: false,
  notes: "Existing note"
};

let mockInventoryItems: InventoryItem[] = [sampleItem];
let mockProjectReservations: ProjectLookupReservation[] = [];

const reservedProject: ProjectLookupReservation = {
  project: {
    id: "project-1",
    folder: null,
    name: "Autumn Sampler",
    author: null,
    canvasMesh: null,
    status: "wip",
    startDate: null,
    completedDate: null,
    imageUri: null,
    notes: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  referenceColor: sampleItem.referenceColor,
  quantity: 3,
  physicalStash: 2,
  reserved: 1,
  available: 1,
  stillNeed: 1
};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "color-310" }),
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
    inventory: mockInventoryItems,
    addInventory: mockAddInventory,
    decrementInventory: mockDecrementInventory,
    updateInventory: mockUpdateInventory,
    toggleFavorite: mockToggleFavorite,
    removeInventory: mockRemoveInventory,
    setConditionQuantity: mockSetConditionQuantity
  })
}));

jest.mock("../src/state/ProjectsContext", () => ({
  useProjects: () => ({
    getReservationsByReferenceColor: () => mockProjectReservations
  })
}));

jest.mock("../src/state/CatalogContext", () => ({
  useCatalog: () => ({
    getThreadTypeDisplayName: () => "DMC Six-Strand"
  })
}));

describe("DetailScreen notes editing", () => {
  beforeEach(() => {
    mockInventoryItems = [sampleItem];
    mockProjectReservations = [];
    mockUpdateInventory.mockClear();
    mockSetConditionQuantity.mockClear();
    mockToggleFavorite.mockClear();
    mockRemoveInventory.mockClear();
    mockDecrementInventory.mockClear();
    mockAddInventory.mockClear();
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it("saves note changes to the full row when the notes field loses focus", async () => {
    const { getByPlaceholderText, getByTestId, UNSAFE_getByType } = render(<DetailScreen />);

    const input = getByPlaceholderText("Notes about this skein...");

    expect(getByTestId("detail-keyboard-body")).toBeTruthy();
    expect(getByTestId("detail-keyboard-scroll")).toBeTruthy();
    expect(UNSAFE_getByType(ScrollView).props.keyboardDismissMode).toBe("none");

    fireEvent.changeText(input, "  Updated note  ");
    fireEvent(input, "blur");

    await waitFor(() => {
      expect(mockUpdateInventory).toHaveBeenCalledWith("inv-1", { notes: "  Updated note  " });
    });
  });

  it("commits note edits before incrementing full quantity", async () => {
    const { getByPlaceholderText, getByTestId } = render(<DetailScreen />);

    fireEvent.changeText(getByPlaceholderText("Notes about this skein..."), "Before increment");
    fireEvent.press(getByTestId("detail-full-increment-button"));

    await waitFor(() => {
      expect(mockUpdateInventory).toHaveBeenCalledWith("inv-1", { notes: "Before increment" });
      expect(mockSetConditionQuantity).toHaveBeenCalledWith(
        "color-310",
        "full",
        3,
        expect.objectContaining({ notes: "Before increment" })
      );
    });

    expect(mockUpdateInventory.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetConditionQuantity.mock.invocationCallOrder[0]
    );
  });

  it("commits note edits before decrementing full quantity", async () => {
    const { getByPlaceholderText, getByTestId } = render(<DetailScreen />);

    fireEvent.changeText(getByPlaceholderText("Notes about this skein..."), "Before decrement");
    fireEvent.press(getByTestId("detail-full-decrement-button"));

    await waitFor(() => {
      expect(mockUpdateInventory).toHaveBeenCalledWith("inv-1", { notes: "Before decrement" });
      expect(mockSetConditionQuantity).toHaveBeenCalledWith("color-310", "full", 1);
    });

    expect(mockUpdateInventory.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetConditionQuantity.mock.invocationCallOrder[0]
    );
  });

  it("commits note edits before toggling favorite", async () => {
    const { getByPlaceholderText, getByTestId } = render(<DetailScreen />);

    fireEvent.changeText(getByPlaceholderText("Notes about this skein..."), "Before favorite");
    fireEvent.press(getByTestId("detail-favorite-toggle"));

    await waitFor(() => {
      expect(mockUpdateInventory).toHaveBeenCalledWith("inv-1", { notes: "Before favorite" });
      expect(mockUpdateInventory).toHaveBeenCalledWith("inv-1", { favorite: true });
    });

    const noteCallOrder = mockUpdateInventory.mock.invocationCallOrder[0];
    const favoriteCallOrder = mockUpdateInventory.mock.invocationCallOrder[1];
    expect(noteCallOrder).toBeLessThan(favoriteCallOrder);
  });

  it("renders project reservations and commits note edits before opening a project", async () => {
    mockProjectReservations = [reservedProject];
    const { getByPlaceholderText, getByTestId, getByText } = render(<DetailScreen />);

    expect(getByText("Autumn Sampler")).toBeTruthy();
    expect(getByText("Still need 1")).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText("Notes about this skein..."), "Before project");
    fireEvent.press(getByTestId("detail-project-project-1"));

    await waitFor(() => {
      expect(mockUpdateInventory).toHaveBeenCalledWith("inv-1", { notes: "Before project" });
      expect(mockPush).toHaveBeenCalledWith("/project/project-1");
    });

    expect(mockUpdateInventory.mock.invocationCallOrder[0]).toBeLessThan(mockPush.mock.invocationCallOrder[0]);
  });

  it("renders an empty state when no projects reserve the color", () => {
    const { getByText } = render(<DetailScreen />);

    expect(getByText("No projects are reserving this color yet.")).toBeTruthy();
  });
});
