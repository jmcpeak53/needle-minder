"""
Extract DMC thread data from the inventory spreadsheet and write the reference CSV.

Usage:
    python scripts/extract-dmc-catalog.py

Output:
    data/reference/dmc-six-strand.csv

Source file:
    sampleData/dmc-thread-inventory-sheet-updated-apr26 (2).xlsx

The spreadsheet stores hex colours as cell fill colours in the styles.xml,
not as text values. This script reads the OOXML directly to extract them.
"""

import csv
import os
import sys
import xml.etree.ElementTree as ET
import zipfile

XLSX = os.path.join(os.path.dirname(__file__), "..", "sampleData",
                    "dmc-thread-inventory-sheet-updated-apr26 (2).xlsx")
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "data", "reference",
                      "dmc-six-strand.csv")

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

# Sheet IDs within the workbook (rId → worksheet file mapping confirmed from
# xl/_rels/workbook.xml.rels):
#   rId9  → sheet9.xml  → "DMC Threads - By Color"  (clean by-colour list)
#   rId4  → sheet4.xml  → hidden data table with colour swatch cells
#
# sheet6.xml is "DMC Threads - By Color" (sorted, 575 rows):
#   col A = colorCode, col B = colorName, col D = group number (1–26)
# sheet7.xml is the hidden inventory table with colour swatch cells:
#   col A = colorCode, col C = colour swatch (hex via cell fill style)
SHEET_BY_COLOR = "xl/worksheets/sheet6.xml"
SHEET_COLOR_SWATCHES = "xl/worksheets/sheet7.xml"

# Which colour groups from sheet6 to include and their thread subtype.
# Groups 22-23 = Metallic Embroidery Floss (E-prefix)
# Group  26    = Metallic Pearl (5282, 5283)
# Groups 21    = Classic variegated six-strand
# Groups 24-25 = Color Variations (4000-series variegated)
GROUP_SUBTYPE: dict[int, str] = {
    **{g: "solid" for g in range(1, 21)},
    21: "variegated",
    22: "metallic",
    23: "metallic",
    24: "variegated",
    25: "variegated",
    26: "metallic",
    33: "solid",   # anomalous single row in group 3 range
}

GROUP_FAMILY: dict[int, str] = {
    1:  "Red",
    2:  "Pink",
    3:  "Pink",
    4:  "Lavender",
    5:  "Purple",
    6:  "Blue",
    7:  "Blue",
    8:  "Blue",
    9:  "Blue Green",
    10: "Green",
    11: "Green",
    12: "Green",
    13: "Yellow",
    14: "Yellow",
    15: "Orange",
    16: "Orange",
    17: "Peach",
    18: "Brown",
    19: "Gray",
    20: "Black and White",
    21: "Variegated",
    22: "Metallic",
    23: "Metallic",
    24: "Variations",
    25: "Variations",
    26: "Metallic",
    33: "Pink",
}


def tag(local: str) -> str:
    return f"{{{NS}}}{local}"


def parse_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    result: list[str] = []
    for si in root.findall(f".//{tag('si')}"):
        text = "".join(t.text or "" for t in si.findall(f".//{tag('t')}"))
        result.append(text)
    return result


def parse_styles(zf: zipfile.ZipFile) -> dict[int, str]:
    """Return mapping: style_index → '#RRGGBB'."""
    root = ET.fromstring(zf.read("xl/styles.xml"))

    fills: list[str | None] = []
    for fill in root.findall(f".//{tag('fills')}/{tag('fill')}"):
        pf = fill.find(f".//{tag('patternFill')}")
        if pf is None:
            fills.append(None)
            continue
        fg = pf.find(tag("fgColor"))
        if fg is not None:
            rgb = fg.get("rgb")
            if rgb and len(rgb) == 8:
                fills.append("#" + rgb[2:].upper())
                continue
        fills.append(None)

    xfs = root.findall(f".//{tag('cellXfs')}/{tag('xf')}")
    style_to_hex: dict[int, str] = {}
    for i, xf in enumerate(xfs):
        fill_id = int(xf.get("fillId", 0))
        if fill_id < len(fills) and fills[fill_id]:
            style_to_hex[i] = fills[fill_id]  # type: ignore[assignment]
    return style_to_hex


def col_letter(ref: str) -> str:
    return "".join(ch for ch in ref if ch.isalpha())


def parse_sheet(zf: zipfile.ZipFile, sheet_path: str,
                shared: list[str]) -> list[dict]:
    """Parse a worksheet into a list of {col_letter: value} dicts per row."""
    root = ET.fromstring(zf.read(sheet_path))
    rows = []
    for row_el in root.findall(f".//{tag('row')}"):
        cells: dict[str, dict] = {}
        for c in row_el.findall(tag("c")):
            ref = c.get("r", "")
            t = c.get("t", "")
            s = c.get("s", "")
            v = c.find(tag("v"))
            val = ""
            if v is not None and v.text:
                val = shared[int(v.text)] if t == "s" else v.text
            cells[col_letter(ref)] = {"val": val, "s": s}
        rows.append(cells)
    return rows


# Representative hex values for threads whose colour swatches are absent from
# the spreadsheet (variegated threads have no single fill colour by nature;
# these are the dominant / characteristic tone for each thread).
FALLBACK_HEX: dict[str, str] = {
    # Classic variegated six-strand (group 21)
    "48":  "#FFB7C5",  # Variegated - Baby Pink
    "51":  "#CC5500",  # Variegated - Burnt Orange
    "52":  "#9B2FC9",  # Variegated - Violet
    "53":  "#A0A0A0",  # Variegated - Steel Grey
    "67":  "#B0C4DE",  # Variegated - Baby Blue
    "69":  "#A0522D",  # Variegated - Terra Cotta
    "90":  "#FFD700",  # Variegated - Yellow
    "92":  "#5F7A3A",  # Variegated - Avocado
    "93":  "#7B9EC7",  # Variegated - Blue Haze
    "94":  "#8B8B6B",  # Variegated - Khaki Green
    "99":  "#BF7E9A",  # Variegated - Mauve
    "105": "#8B7355",  # Variegated - Tan/Brown
    "106": "#FF6B4E",  # Variegated - Coral
    "107": "#FF6B81",  # Variegated - Carnation
    "111": "#C8A000",  # Variegated - Mustard
    "115": "#6B0018",  # Variegated - Garnet
    "121": "#1E4B8B",  # Variegated - Delft Blue
    "125": "#5DA87B",  # Variegated - Seafoam Green
    # Color Variations (groups 24-25, 4000-series)
    "4010": "#87CEEB",  # Winter Sky
    "4015": "#778899",  # Stormy Skies
    "4020": "#20B2AA",  # Tropical Waters
    "4025": "#0099BB",  # Caribbean Bay
    "4030": "#9B7CC3",  # Monet's Garden
    "4040": "#9ECFC4",  # Water Lillies
    "4045": "#2E5C2E",  # Evergreen Forest
    "4050": "#7CBE7C",  # Roaming Pastures
    "4060": "#8FBC8F",  # Weeping Willow
    "4065": "#A5C77A",  # Morning Meadow
    "4070": "#C46A25",  # Autumn Leaves
    "4075": "#D4A95A",  # Wheat Fields
    "4077": "#F0C040",  # Morning Sunshine
    "4080": "#FFE135",  # Daffodil Fields
    "4090": "#C8931A",  # Golden Oasis
    "4100": "#A8C8E8",  # Summer Breeze
    "4110": "#FF8C42",  # Sunrise
    "4120": "#FF6840",  # Tropical Sunset
    "4124": "#CC3300",  # Bonfire
    "4126": "#C1673E",  # Desert Canyon
    "4128": "#C8A040",  # Gold Coast
    "4130": "#E05538",  # Chilean Sunset
    "4140": "#8B7353",  # Driftwood
    "4145": "#C2A87A",  # Sandune
    "4150": "#D4B88A",  # Desert Sand
    "4160": "#F0EAE0",  # Glistening Pearl
    "4170": "#E8E0D0",  # Whispering Wind
    "4180": "#E88A9B",  # Rose Petals
    "4190": "#E87060",  # Ocean Coral
    "4200": "#E03030",  # Wild Fire
    "4210": "#C01030",  # Radiant Ruby
    "4215": "#60C0A8",  # Northern Lights
    "4220": "#B498D0",  # Lavender Fields
    "4230": "#78BACE",  # Crystal Water
    "4235": "#60A8C0",  # Arctic Sea
    "4240": "#3050A0",  # Mid Summer Night
    # Missing metallic threads
    "E135":  "#E0B040",  # Metallic - Golden Dawn
    "E130":  "#8070C0",  # Metallic - Gemstones
    "E940":  "#80FF00",  # Glow-In-The-Dark (neon green)
    "E5200": "#F0F0F0",  # Metallic - White
    "E3747": "#A8C8E8",  # Metallic - Sky Blue
}


def build_code_to_hex(swatch_rows: list[dict],
                      style_to_hex: dict[int, str]) -> dict[str, str]:
    """Build colorCode → '#RRGGBB' from swatch sheet style indices."""
    result: dict[str, str] = {}
    for row in swatch_rows:
        a = row.get("A", {}).get("val", "").strip()
        c = row.get("C", {})
        s = c.get("s", "")
        if not a or not s:
            continue
        code = a.rstrip("^*").upper()
        try:
            hex_val = style_to_hex.get(int(s))
        except ValueError:
            continue
        if hex_val:
            result[code] = hex_val
    return result


def extract_catalog(zf: zipfile.ZipFile) -> list[dict]:
    shared = parse_shared_strings(zf)
    style_to_hex = parse_styles(zf)

    swatch_rows = parse_sheet(zf, SHEET_COLOR_SWATCHES, shared)
    code_to_hex = build_code_to_hex(swatch_rows, style_to_hex)

    by_color_rows = parse_sheet(zf, SHEET_BY_COLOR, shared)

    catalog: list[dict] = []
    warnings: list[str] = []

    for row in by_color_rows:
        raw_code = row.get("A", {}).get("val", "").strip()
        name = row.get("B", {}).get("val", "").strip()
        group_raw = row.get("D", {}).get("val", "").strip()

        if not raw_code or not name or not group_raw:
            continue

        try:
            group = int(group_raw)
        except ValueError:
            continue

        if group not in GROUP_SUBTYPE:
            warnings.append(f"Skipping unknown group {group}: {raw_code} {name}")
            continue

        code = raw_code.rstrip("^*").upper()
        subtype = GROUP_SUBTYPE[group]
        family = GROUP_FAMILY[group]
        is_variegated = subtype == "variegated"

        hex_rgb = code_to_hex.get(code) or FALLBACK_HEX.get(code)
        if not hex_rgb:
            warnings.append(f"No hex colour found for {code} ({name}); skipping.")
            continue

        catalog.append({
            "colorCode": code,
            "colorName": name,
            "colorFamily": family,
            "hexRgb": hex_rgb,
            "isVariegated": "true" if is_variegated else "false",
            "threadSubtype": subtype,
            "upc": "",
        })

    for w in warnings:
        print(f"WARNING: {w}", file=sys.stderr)

    return catalog


def write_csv(catalog: list[dict], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fieldnames = ["colorCode", "colorName", "colorFamily",
                  "hexRgb", "isVariegated", "threadSubtype", "upc"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(catalog)
    print(f"Wrote {len(catalog)} colors to {path}")


def main() -> None:
    if not os.path.exists(XLSX):
        print(f"ERROR: spreadsheet not found at {XLSX}", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(XLSX) as zf:
        catalog = extract_catalog(zf)

    write_csv(catalog, OUTPUT)


if __name__ == "__main__":
    main()
