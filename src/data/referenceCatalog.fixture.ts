import type { ReferenceColor, ThreadType } from "../types";
import {
  dmcSixStrandThreadType,
  referenceColorFixture as dmcSixStrandReferenceColorFixture
} from "./referenceColors.fixture";
import {
  dmcPearlCotton5ThreadType,
  pearlCotton5ReferenceColorFixture
} from "./pearlCotton5.fixture";

export const threadTypeFixture: ThreadType[] = [
  dmcSixStrandThreadType,
  dmcPearlCotton5ThreadType
];

export const referenceColorFixture: ReferenceColor[] = [
  ...dmcSixStrandReferenceColorFixture,
  ...pearlCotton5ReferenceColorFixture
];
