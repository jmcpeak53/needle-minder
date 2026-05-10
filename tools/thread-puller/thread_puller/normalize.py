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
    dedupe_report_rows: list[dict[str, str]]


def load_reference_rows(path: Path) -> dict[str, CanonicalRow]:
    rows = _load_reference_row_list(path)
    return {row.color_code: row for row in rows}


def load_target_reference_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []

    rows: list[dict[str, str]] = []
    seen_codes: dict[str, int] = {}
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for index, row in enumerate(reader, start=2):
            code = (row.get("colorCode") or "").strip().upper()
            if not code:
                continue
            if code in seen_codes:
                first_row = seen_codes[code]
                raise ValueError(f"{path} has duplicate colorCode {code} at rows {first_row} and {index}")
            seen_codes[code] = index
            rows.append(_normalize_reference_dict(row, code))
    return rows


def normalize_products(
    products: list[RawProduct],
    catalog: CatalogConfig,
    canonical_map: dict[str, CanonicalRow],
    existing_reference_rows: list[dict[str, str]] | None = None,
) -> NormalizationResult:
    include_re = re.compile(catalog.title_include_regex, re.IGNORECASE)
    exclude_re = re.compile(catalog.title_exclude_regex, re.IGNORECASE)
    code_re = re.compile(catalog.color_code_regex, re.IGNORECASE)

    listings: list[NormalizedListing] = []
    unmatched_codes: list[str] = []
    dedupe_report_rows: list[dict[str, str]] = []
    existing_rows = existing_reference_rows or []
    reference_by_code: dict[str, dict[str, str]] = {
        row["colorCode"].upper(): row for row in existing_rows if row.get("colorCode")
    }
    appended_codes: set[str] = set()
    seen_scrape_codes: set[str] = set()

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
        duplicate_scrape = code in seen_scrape_codes
        seen_scrape_codes.add(code)

        if duplicate_scrape:
            match_status = "duplicate_skipped"
        elif code in reference_by_code:
            match_status = "existing"
        elif canonical:
            match_status = "new"
        else:
            match_status = "unmatched"

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

        if duplicate_scrape:
            dedupe_report_rows.append(
                _dedupe_report_row(
                    code=code,
                    status="duplicate_skipped",
                    reason="Duplicate colorCode appeared more than once in the same scrape; later record was ignored.",
                    product=product,
                    source_color_name=parsed.source_color_name,
                )
            )
            continue

        if code in reference_by_code:
            dedupe_report_rows.append(
                _dedupe_report_row(
                    code=code,
                    status="existing_skipped",
                    reason="colorCode already exists in target reference CSV; scraped record was not appended.",
                    product=product,
                    source_color_name=parsed.source_color_name,
                )
            )
            continue

        if canonical is None:
            if code not in unmatched_codes:
                unmatched_codes.append(code)
            dedupe_report_rows.append(
                _dedupe_report_row(
                    code=code,
                    status="unmatched",
                    reason="No canonical metadata found; incomplete row was not appended.",
                    product=product,
                    source_color_name=parsed.source_color_name,
                )
            )
            continue

        reference_by_code[code] = {
            "colorCode": code,
            "colorName": canonical.color_name,
            "colorFamily": canonical.color_family,
            "hexRgb": canonical.hex_rgb,
            "isVariegated": "true" if canonical.is_variegated else "false",
            "threadSubtype": canonical.thread_subtype,
            "upc": product.barcode or canonical.upc or "",
        }
        appended_codes.add(code)
        dedupe_report_rows.append(
            _dedupe_report_row(
                code=code,
                status="new_appended",
                reason="New colorCode with canonical metadata was appended to target reference CSV.",
                product=product,
                source_color_name=parsed.source_color_name,
            )
        )

    existing_codes = [row["colorCode"].upper() for row in existing_rows if row.get("colorCode")]
    new_codes = sorted(appended_codes)
    reference_rows = [reference_by_code[code] for code in existing_codes + new_codes]
    return NormalizationResult(
        listings=listings,
        unmatched_codes=sorted(unmatched_codes),
        reference_rows=reference_rows,
        dedupe_report_rows=dedupe_report_rows,
    )


def _load_reference_row_list(path: Path) -> list[CanonicalRow]:
    rows: list[CanonicalRow] = []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            code = (row.get("colorCode") or "").strip().upper()
            if not code:
                continue
            rows.append(
                CanonicalRow(
                    color_code=code,
                    color_name=(row.get("colorName") or "").strip(),
                    color_family=(row.get("colorFamily") or "").strip(),
                    hex_rgb=(row.get("hexRgb") or "").strip().upper(),
                    is_variegated=(row.get("isVariegated") or "").strip().lower() == "true",
                    thread_subtype=(row.get("threadSubtype") or "solid").strip().lower(),
                    upc=(row.get("upc") or "").strip() or None,
                )
            )
    return rows


def _normalize_reference_dict(row: dict[str, str], code: str) -> dict[str, str]:
    return {
        "colorCode": code,
        "colorName": (row.get("colorName") or "").strip(),
        "colorFamily": (row.get("colorFamily") or "").strip(),
        "hexRgb": (row.get("hexRgb") or "").strip().upper(),
        "isVariegated": (row.get("isVariegated") or "").strip().lower(),
        "threadSubtype": (row.get("threadSubtype") or "solid").strip().lower(),
        "upc": (row.get("upc") or "").strip(),
    }


def _dedupe_report_row(
    *,
    code: str,
    status: str,
    reason: str,
    product: RawProduct,
    source_color_name: str,
) -> dict[str, str]:
    return {
        "colorCode": code,
        "status": status,
        "reason": reason,
        "source": product.source,
        "sourceColorName": source_color_name,
        "sku": product.sku or "",
        "barcode": product.barcode or "",
        "priceCents": str(product.price_cents) if product.price_cents is not None else "",
        "currency": product.currency or "",
        "available": "" if product.available is None else str(product.available).lower(),
        "productUrl": product.product_url,
    }
