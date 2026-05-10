import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import AddScreen from "../app/(tabs)/add";
import ScanScreen from "../app/(tabs)/scan";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockAddInventory = jest.fn();
const mockSetConfirming = jest.fn();
const mockAddToStash = jest.fn();
const mockReset = jest.fn();

const sampleThreadType = {
  id: "dmc-six-strand",
  displayName: "DMC Six-Strand Embroidery Floss",
  manufacturer: "DMC"
};

const sampleColor = {
  id: "color-310",
  threadTypeId: "dmc-six-strand",
  colorCode: "310",
  colorName: "Black",
  colorFamily: "Black and Gray",
  hexRgb: "#000000",
  isVariegated: false,
  threadSubtype: "solid" as const,
  upc: null
};

let mockScanFlowState: ReturnType<typeof buildScanFlowState>;

function buildScanFlowState() {
  return {
    cameraRef: { current: null },
    candidates: [],
    rawText: "",
    scanError: null,
    setScanError: jest.fn(),
    isScanning: false,
    confirming: {
      candidate: { colorCode: "310", confidence: 0.9, raw: "310" },
      color: sampleColor,
      quantity: 1,
      condition: "full" as const,
      favorite: false,
      notes: "",
      selectionToast: null
    },
    setConfirming: mockSetConfirming,
    catalogChoice: null,
    saveForSession: false,
    setSaveForSession: jest.fn(),
    selectionToast: null,
    saved: false,
    capture: jest.fn(),
    addToStash: mockAddToStash,
    chooseCatalogMatch: jest.fn(),
    reset: mockReset,
    catalog: [sampleColor],
    threadTypes: [sampleThreadType],
    sessionCatalogThreadTypeId: null
  };
}

jest.mock("expo-router", () => ({
  useFocusEffect: () => undefined,
  useRouter: () => ({ back: mockBack, push: mockPush })
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons"
}));

jest.mock("expo-camera", () => ({
  CameraView: "CameraView",
  useCameraPermissions: () => [{ granted: true }, jest.fn()]
}));

jest.mock("../src/state/CatalogContext", () => ({
  useCatalog: () => ({
    ready: true,
    catalog: [sampleColor],
    threadTypes: [sampleThreadType],
    defaultCatalogFilter: "all",
    getThreadTypeById: () => sampleThreadType,
    getThreadTypeDisplayName: () => sampleThreadType.displayName
  })
}));

jest.mock("../src/state/InventoryContext", () => ({
  useInventory: () => ({
    addInventory: mockAddInventory
  })
}));

jest.mock("../src/scan/useScanFlow", () => ({
  useScanFlow: () => mockScanFlowState
}));

describe("keyboard-aware inventory entry screens", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
    mockAddInventory.mockClear();
    mockSetConfirming.mockClear();
    mockAddToStash.mockClear();
    mockReset.mockClear();
    mockScanFlowState = buildScanFlowState();
  });

  it("keeps the add flow list inside the keyboard-aware body when a color is selected", () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<AddScreen />);

    fireEvent.press(getByText("Black and Gray"));
    fireEvent.press(getByText("Black"));

    expect(getByTestId("add-keyboard-body")).toBeTruthy();
    expect(getByPlaceholderText("Notes (optional)")).toBeTruthy();
  });

  it("wraps the scan confirm form in the shared keyboard-aware body", () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(<ScanScreen />);

    expect(getByTestId("scan-confirm-keyboard-body")).toBeTruthy();
    expect(getByTestId("scan-confirm-keyboard-scroll")).toBeTruthy();
    expect(getByPlaceholderText("Notes (optional)")).toBeTruthy();
    expect(getByText("Add to stash")).toBeTruthy();
  });
});
