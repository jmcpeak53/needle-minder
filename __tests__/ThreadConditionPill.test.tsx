import React from "react";
import { render } from "@testing-library/react-native";

import { ThreadConditionPill } from "../src/ui/ThreadConditionPill";

describe("ThreadConditionPill", () => {
  it("renders the full skein label", () => {
    const { getByText } = render(<ThreadConditionPill condition="full" />);

    expect(getByText("Full skein")).toBeTruthy();
  });

  it("renders the partial skein label", () => {
    const { getByText } = render(<ThreadConditionPill condition="partial" />);

    expect(getByText("Partial skein")).toBeTruthy();
  });
});
