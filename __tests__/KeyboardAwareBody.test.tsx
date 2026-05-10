import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { render } from "@testing-library/react-native";

import { KeyboardAwareBody } from "../src/ui/KeyboardAwareBody";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 12 })
}));

describe("KeyboardAwareBody", () => {
  it("renders a keyboard-aware scroll container by default", () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <KeyboardAwareBody testID="keyboard-aware-body" scrollTestID="keyboard-aware-scroll" contentBottomPadding={40}>
        <Text>Body content</Text>
      </KeyboardAwareBody>
    );

    const keyboardView = getByTestId("keyboard-aware-body");
    const scrollView = getByTestId("keyboard-aware-scroll");
    const keyboardViewByType = UNSAFE_getByType(KeyboardAvoidingView);
    const scrollViewByType = UNSAFE_getByType(ScrollView);

    expect(keyboardView).toBeTruthy();
    expect(scrollView).toBeTruthy();
    expect(keyboardViewByType.props.behavior).toBe(Platform.OS === "ios" ? "padding" : "height");
    expect(scrollViewByType.props.keyboardDismissMode).toBe("on-drag");
    expect(scrollViewByType.props.keyboardShouldPersistTaps).toBe("handled");
    expect(scrollViewByType.props.contentContainerStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingBottom: 52 })])
    );
  });

  it("allows screens to override keyboard dismissal behavior", () => {
    const { UNSAFE_getByType } = render(
      <KeyboardAwareBody keyboardDismissMode="none">
        <Text>Body content</Text>
      </KeyboardAwareBody>
    );

    expect(UNSAFE_getByType(ScrollView).props.keyboardDismissMode).toBe("none");
  });
});
