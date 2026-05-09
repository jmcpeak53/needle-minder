import { radius, spacing } from "./theme";

export const pillRowViewportStyle = {
  minHeight: 38 + spacing.sm * 2,
  overflow: "visible"
} as const;

export const pillRowContentStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  paddingVertical: spacing.sm
} as const;

export const pillFrameStyle = {
  minHeight: 38,
  alignSelf: "flex-start",
  flexShrink: 0,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: radius.pill,
  paddingHorizontal: 12,
  paddingVertical: 8
} as const;

export const pillLabelLineHeight = 17;
export const pillCountLineHeight = 12;
