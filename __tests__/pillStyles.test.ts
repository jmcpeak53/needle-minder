import {
  pillCountLineHeight,
  pillFrameStyle,
  pillLabelLineHeight,
  pillRowContentStyle,
  pillRowViewportStyle
} from "../src/ui/pillStyles";

describe("pillStyles", () => {
  it("keeps horizontally scrolling pill rows centered instead of stretched", () => {
    expect(pillRowContentStyle).toMatchObject({
      flexDirection: "row",
      alignItems: "center"
    });
  });

  it("gives pill rows enough viewport height so Android does not clip rounded bottoms", () => {
    expect(pillRowViewportStyle.minHeight).toBeGreaterThanOrEqual(pillFrameStyle.minHeight + 2);
  });

  it("locks pill buttons to a stable cross-axis size", () => {
    expect(pillFrameStyle).toMatchObject({
      minHeight: 38,
      alignSelf: "flex-start",
      flexShrink: 0,
      justifyContent: "center"
    });
  });

  it("uses explicit line heights so text does not clip inside pills", () => {
    expect(pillLabelLineHeight).toBeGreaterThan(12);
    expect(pillCountLineHeight).toBeGreaterThan(10);
  });
});
