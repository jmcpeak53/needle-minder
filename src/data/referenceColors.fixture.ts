import type { ReferenceColor, ThreadType } from "../types";

export const dmcSixStrandThreadType: ThreadType = {
  id: "dmc-six-strand",
  manufacturer: "DMC",
  productLine: "Six-Strand Embroidery Floss",
  displayName: "DMC Six-Strand Embroidery Floss",
  isActive: true
};

export const referenceColorFixture: ReferenceColor[] = [
  {
    id: "dmc-310",
    threadTypeId: dmcSixStrandThreadType.id,
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and Gray",
    hexRgb: "#000000",
    isVariegated: false,
    upc: null
  },
  {
    id: "dmc-321",
    threadTypeId: dmcSixStrandThreadType.id,
    colorCode: "321",
    colorName: "Red",
    colorFamily: "Red",
    hexRgb: "#C72B3B",
    isVariegated: false,
    upc: "077540051106"
  },
  {
    id: "dmc-666",
    threadTypeId: dmcSixStrandThreadType.id,
    colorCode: "666",
    colorName: "Bright Red",
    colorFamily: "Red",
    hexRgb: "#E31D42",
    isVariegated: false,
    upc: null
  },
  {
    id: "dmc-699",
    threadTypeId: dmcSixStrandThreadType.id,
    colorCode: "699",
    colorName: "Green",
    colorFamily: "Green",
    hexRgb: "#056517",
    isVariegated: false,
    upc: null
  },
  {
    id: "dmc-b5200",
    threadTypeId: dmcSixStrandThreadType.id,
    colorCode: "B5200",
    colorName: "Snow White",
    colorFamily: "White",
    hexRgb: "#FFFFFF",
    isVariegated: false,
    upc: null
  },
  {
    id: "dmc-115",
    threadTypeId: dmcSixStrandThreadType.id,
    colorCode: "115",
    colorName: "Garnet",
    colorFamily: "Red",
    hexRgb: "#8F011B",
    isVariegated: true,
    upc: null
  }
];
