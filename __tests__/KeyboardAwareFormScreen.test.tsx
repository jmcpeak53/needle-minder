import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { render } from "@testing-library/react-native";

import { KeyboardAwareFormScreen } from "../src/ui/KeyboardAwareFormScreen";
import { spacing } from "../src/ui/theme";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 12 })
}));

describe("KeyboardAwareFormScreen", () => {
  it("renders a fixed header and keyboard-aware scroll body", () => {
    const { getByText, getByTestId, UNSAFE_getByType } = render(
      <KeyboardAwareFormScreen title="New project" onBackPress={() => undefined}>
        <Text>Body content</Text>
      </KeyboardAwareFormScreen>
    );

    expect(getByText("Back")).toBeTruthy();
    expect(getByText("New project")).toBeTruthy();
    expect(getByText("Body content")).toBeTruthy();

    const keyboardWrapper = getByTestId("keyboard-aware-form-screen");
    const scrollView = getByTestId("keyboard-aware-form-scroll");
    const keyboardViewByType = UNSAFE_getByType(KeyboardAvoidingView);
    const scrollViewByType = UNSAFE_getByType(ScrollView);

    expect(keyboardWrapper).toBeTruthy();
    expect(scrollView).toBeTruthy();
    expect(keyboardViewByType.props.behavior).toBe(Platform.OS === "ios" ? "padding" : "height");
    expect(scrollViewByType.props.keyboardDismissMode).toBe("on-drag");
    expect(scrollViewByType.props.keyboardShouldPersistTaps).toBe("handled");
    expect(keyboardViewByType).toBeTruthy();
    expect(scrollViewByType).toBeTruthy();
    expect(scrollViewByType.props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingBottom: 12 + spacing.xl })])
    );
  });

  it("passes through keyboard dismissal overrides", () => {
    const { UNSAFE_getByType } = render(
      <KeyboardAwareFormScreen
        title="Edit project"
        onBackPress={() => undefined}
        keyboardDismissMode="none"
      >
        <Text>Body content</Text>
      </KeyboardAwareFormScreen>
    );

    expect(UNSAFE_getByType(ScrollView).props.keyboardDismissMode).toBe("none");
  });
});
