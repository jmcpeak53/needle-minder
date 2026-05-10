import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import { InventoryNotesEditor } from "../src/inventory/components/InventoryNotesEditor";

describe("InventoryNotesEditor", () => {
  it("shows a running counter and enforces the 255 character limit", () => {
    const onChangeText = jest.fn();
    const onBlur = jest.fn();
    const { getByPlaceholderText, getByText, rerender } = render(
      <InventoryNotesEditor value="" onChangeText={onChangeText} onBlur={onBlur} />
    );

    const input = getByPlaceholderText("Notes about this skein...");

    expect(getByText("0/255")).toBeTruthy();
    expect(input.props.maxLength).toBe(255);

    rerender(<InventoryNotesEditor value="abc" onChangeText={onChangeText} onBlur={onBlur} />);

    expect(getByText("3/255")).toBeTruthy();
  });

  it("grows taller when the note content spans multiple lines", () => {
    const { getByPlaceholderText } = render(
      <InventoryNotesEditor value="Line 1" onChangeText={jest.fn()} onBlur={jest.fn()} />
    );

    const input = getByPlaceholderText("Notes about this skein...");
    const initialStyle = StyleSheet.flatten(input.props.style);

    fireEvent(input, "contentSizeChange", { nativeEvent: { contentSize: { height: 164 } } });

    const expandedStyle = StyleSheet.flatten(getByPlaceholderText("Notes about this skein...").props.style);

    expect(expandedStyle.height).toBe(164);
    expect(initialStyle.height).toBeLessThan(expandedStyle.height);
  });
});
