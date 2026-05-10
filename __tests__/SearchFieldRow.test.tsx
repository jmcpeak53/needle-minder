import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { SearchFieldRow } from "../src/ui/SearchFieldRow";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons"
}));

describe("SearchFieldRow", () => {
  it("shows a larger clear button tap target when text is present", () => {
    const onChangeText = jest.fn();
    const onClear = jest.fn();
    const { getByTestId } = render(
      <SearchFieldRow
        value="310"
        onChangeText={onChangeText}
        onClear={onClear}
        placeholder="Search"
        clearButtonTestID="search-clear-button"
      />
    );

    const clearButton = getByTestId("search-clear-button");
    expect(clearButton.props.hitSlop).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });

    fireEvent.press(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("falls back to clearing through onChangeText when no onClear handler is provided", () => {
    const onChangeText = jest.fn();
    const { getByTestId, queryByTestId, rerender } = render(
      <SearchFieldRow
        value=""
        onChangeText={onChangeText}
        placeholder="Search"
        clearButtonTestID="search-clear-button"
      />
    );

    expect(queryByTestId("search-clear-button")).toBeNull();

    rerender(
      <SearchFieldRow
        value="black"
        onChangeText={onChangeText}
        placeholder="Search"
        clearButtonTestID="search-clear-button"
      />
    );

    fireEvent.press(getByTestId("search-clear-button"));
    expect(onChangeText).toHaveBeenCalledWith("");
  });
});
