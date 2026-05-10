import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import EditProjectScreen from "../app/project/[id]/edit";
import NewProjectScreen from "../app/project/new";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCreateProject = jest.fn();
const mockUpdateProject = jest.fn();

const sampleProject = {
  id: "proj-1",
  folder: "Sampler shelf",
  name: "Autumn Garden",
  author: "Needle Notes",
  canvasMesh: null,
  status: "pattern" as const,
  startDate: null,
  completedDate: null,
  imageUri: null,
  notes: "Existing notes",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
};

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
    projects: [sampleProject]
  })
}));

jest.mock("../src/projects/components/ProjectPhotoPicker", () => ({
  ProjectPhotoPicker: () => null
}));

describe("project screens", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCreateProject.mockReset();
    mockUpdateProject.mockReset();
  });

  it("submits the new project flow and routes to the created project", async () => {
    mockCreateProject.mockResolvedValue("proj-99");

    const { getByPlaceholderText, getByText } = render(<NewProjectScreen />);

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
