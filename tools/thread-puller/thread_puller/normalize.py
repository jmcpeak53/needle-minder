from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path

from .config import CatalogConfig
from .models import NormalizedListing, RawProduct
from .parse import parse_title


@dataclass(slots=True)
class CanonicalRow:
    color_code: str
    color_name: str
    color_family: str
    hex_rgb: str
    is_variegated: bool
    thread_subtype: str
    upc: str | None


@dataclass(slots=True)
class NormalizationResult:
    listings: list[NormalizedListing]
    unmatched_codes: list[str]
    reference_rows: list[dict[str, str]]


def load_reference_rows(path: Path) -> dict[str, CanonicalRow]:
    rows: dict[str, CanonicalRow] = {}
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            code = (row.get("colorCode") or "").strip().upper()
            if not code:
                continue
            rows[code] = CanonicalRow(
                color_code=code,
                color_name=(row.get("colorName") or "").strip(),
                color_family=(row.get("colorFamily") or "").strip(),
                hex_rgb=(row.get("hexRgb") or "").strip().upper(),
                is_variegated=(row.get("isVariegated") or "").strip().lower() == "true",
                thread_subtype=(row.get("threadSubtype") or "solid").strip().lower(),
                upc=(row.get("upc") or "").strip() or None,
            )
    return rows


def normalize_products(
    products: list[RawProduct],
    catalog: CatalogConfig,
    canonical_map: dict[str, CanonicalRow],
) -> NormalizationResult:
    include_re = re.compile(catalog.title_include_regex, re.IGNORECASE)
    exclude_re = re.compile(catalog.title_exclude_regex, re.IGNORECASE)
    code_re = re.compile(catalog.color_code_regex, re.IGNORECASE)

    listings: list[NormalizedListing] = []
    unmatched_codes: list[str] = []
    reference_by_code: dict[str, dict[str, str]] = {}

    for product in products:
        title = " ".join(product.title.split())
        if not include_re.search(title):
            continue
        if exclude_re.search(title):
            continue

        parsed = parse_title(title, code_re)
        if not parsed.color_code:
            continue

        code = parsed.color_code.upper()
        canonical = canonical_map.get(code)
        match_status = "matched" if canonical else "unmatched"

        listings.append(
            NormalizedListing(
                catalog_id=catalog.id,
                source=product.source,
                color_code=code,
                source_color_name=parsed.source_color_name,
                canonical_color_name=canonical.color_name if canonical else None,
                thread_subtype=canonical.thread_subtype if canonical else None,
                sku=product.sku,
                barcode=product.barcode,
                price_cents=product.price_cents,
                currency=product.currency,
                available=product.available,
                product_url=product.product_url,
                image_url=product.image_url,
                matched_reference_color_id=f"{catalog.id}-{code.lower()}" if canonical else None,
                match_status=match_status,
            )
        )

        if canonical is None:
            if code not in unmatched_codes:
                unmatched_codes.append(code)
            continue

        if code not in reference_by_code:
            reference_by_code[code] = {
                "colorCode": code,
                "colorName": canonical.color_name,
                "colorFamily": canonical.color_family,
                "hexRgb": canonical.hex_rgb,
                "isVariegated": "true" if canonical.is_variegated else "false",
                "threadSubtype": canonical.thread_subtype,
                "upc": product.barcode or canonical.upc or "",
            }

    reference_rows = [reference_by_code[code] for code in sorted(reference_by_code.keys())]
    return NormalizationResult(
        listings=listings,
        unmatched_codes=sorted(unmatched_codes),
        reference_rows=reference_rows,
    )
