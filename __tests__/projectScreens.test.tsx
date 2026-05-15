import React from "react";
import { Platform, ScrollView } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import EditProjectScreen from "../app/project/[id]/edit";
import NewProjectScreen from "../app/project/new";
import type { Project } from "../src/projects/types";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCreateProject = jest.fn();
const mockUpdateProject = jest.fn();
let mockPickerDate = new Date(2026, 4, 12);

const sampleProject: Project = {
  id: "proj-1",
  folder: "Sampler shelf",
  name: "Autumn Garden",
  author: "Needle Notes",
  canvasMesh: null,
  status: "pattern",
  startDate: null,
  completedDate: null,
  imageUri: null,
  notes: "Existing notes",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
};

let mockProjects: Project[] = [sampleProject];

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "proj-1" }),
  useRouter: () => ({ back: mockBack, replace: mockReplace })
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons"
}));

jest.mock("../src/state/ProjectsContext", () => ({
  useProjects: () => ({
    createProject: mockCreateProject,
    updateProject: mockUpdateProject,
    projects: mockProjects
  })
}));

jest.mock("../src/projects/components/ProjectPhotoPicker", () => ({
  ProjectPhotoPicker: () => null
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({ onChange }: { onChange: (event: { type: string }, date?: Date) => void }) => (
      <Pressable testID="mock-date-picker" onPress={() => onChange({ type: "set" }, mockPickerDate)}>
        <Text>Mock date picker</Text>
      </Pressable>
    )
  };
});

describe("project screens", () => {
  beforeAll(() => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      get: () => "android"
    });
  });

  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCreateProject.mockReset();
    mockUpdateProject.mockReset();
    mockPickerDate = new Date(2026, 4, 12);
    mockProjects = [sampleProject];
  });

  it("submits the new project flow and routes to the created project", async () => {
    mockCreateProject.mockResolvedValue("proj-99");

    const { getByPlaceholderText, getByText, getByTestId, UNSAFE_getByType } = render(<NewProjectScreen />);

    expect(getByTestId("keyboard-aware-form-scroll")).toBeTruthy();
    expect(UNSAFE_getByType(ScrollView).props.keyboardDismissMode).toBe("none");

    fireEvent.changeText(getByPlaceholderText("Sampler title"), "Moon Sampler");
    fireEvent.changeText(getByPlaceholderText("Designer name"), "A. Stitcher");
    fireEvent.changeText(getByPlaceholderText("Project notes, linen count, conversion reminders…"), "Use 32 count linen");
    fireEvent.press(getByText("Save project"));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        folder: null,
        name: "Moon Sampler",
        author: "A. Stitcher",
        canvasMesh: null,
        status: "not_started",
        startDate: null,
        completedDate: null,
        imageUri: null,
        notes: "Use 32 count linen"
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/project/proj-99");
  });

  it("submits a start date selected from the date picker", async () => {
    mockCreateProject.mockResolvedValue("proj-99");

    const { getByPlaceholderText, getByText, getByTestId } = render(<NewProjectScreen />);

    fireEvent.changeText(getByPlaceholderText("Sampler title"), "Moon Sampler");
    fireEvent.press(getByText("WIP"));
    fireEvent.press(getByText(formatIsoDateLabel(new Date().toISOString().slice(0, 10))));
    fireEvent.press(getByTestId("mock-date-picker"));
    fireEvent.press(getByText("Save project"));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "wip",
          startDate: "2026-05-12",
          completedDate: null
        })
      );
    });
  });

  it("clears an existing project start date", async () => {
    mockUpdateProject.mockResolvedValue(undefined);
    mockProjects = [
      {
        ...sampleProject,
        status: "wip" as const,
        startDate: "2026-05-01"
      }
    ];

    const { getByText } = render(<EditProjectScreen />);

    expect(getByText("May 1, 2026")).toBeTruthy();

    fireEvent.press(getByText("Clear"));
    fireEvent.press(getByText("Save changes"));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith(
        "proj-1",
        expect.objectContaining({
          status: "wip",
          startDate: null,
          completedDate: null
        })
      );
    });
  });

  it("submits a completed date selected from the date picker", async () => {
    mockCreateProject.mockResolvedValue("proj-99");
    mockPickerDate = new Date(2026, 6, 4);

    const { getByPlaceholderText, getByText, getByTestId } = render(<NewProjectScreen />);

    fireEvent.changeText(getByPlaceholderText("Sampler title"), "Moon Sampler");
    fireEvent.press(getByText("Finished"));
    fireEvent.press(getByText("Pick completed date"));
    fireEvent.press(getByTestId("mock-date-picker"));
    fireEvent.press(getByText("Save project"));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "finished",
          startDate: null,
          completedDate: "2026-07-04"
        })
      );
    });
  });

  it("submits the edit project flow and routes back to the project detail screen", async () => {
    mockUpdateProject.mockResolvedValue(undefined);

    const { getByDisplayValue, getByText } = render(<EditProjectScreen />);

    fireEvent.changeText(getByDisplayValue("Autumn Garden"), "Autumn Garden Revised");
    fireEvent.press(getByText("Save changes"));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith("proj-1", {
        folder: "Sampler shelf",
        name: "Autumn Garden Revised",
        author: "Needle Notes",
        canvasMesh: null,
        status: "pattern",
        startDate: null,
        completedDate: null,
        imageUri: null,
        notes: "Existing notes"
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/project/proj-1");
  });
});

function formatIsoDateLabel(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
