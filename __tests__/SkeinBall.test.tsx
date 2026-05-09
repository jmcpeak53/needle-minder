import React from "react";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";

import { SkeinBall } from "../src/ui/SkeinBall";

describe("SkeinBall", () => {
  it("shows a partial marker when enabled for a partial skein", () => {
    const { getByTestId, getByText } = render(
      <SkeinBall color="#abcdef" condition="partial" showConditionBadge />
    );

    const container = getByTestId("skein-container");
    const badge = getByTestId("skein-condition-badge");
    const containerStyle = StyleSheet.flatten(container.props.style);
    const badgeStyle = StyleSheet.flatten(badge.props.style);

    expect(containerStyle.paddingLeft).toBeGreaterThan(0);
    expect(containerStyle.paddingTop).toBeGreaterThan(0);
    expect(badge).toBeTruthy();
    expect(getByText("P")).toBeTruthy();
    expect(badgeStyle.left).toBe(0);
    expect(badgeStyle.top).toBe(0);
    expect(badgeStyle.right).toBeUndefined();
  });

  it("does not show a partial marker for a full skein", () => {
    const { queryByTestId, queryByText } = render(
      <SkeinBall color="#abcdef" condition="full" showConditionBadge />
    );

    expect(queryByTestId("skein-condition-badge")).toBeNull();
    expect(queryByText("P")).toBeNull();
  });
});
