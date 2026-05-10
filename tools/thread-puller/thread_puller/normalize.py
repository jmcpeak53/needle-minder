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
    return {_lookup_code_key(row.color_code): row for row in rows}


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
            lookup_key = _lookup_code_key(code)
            if lookup_key in seen_codes:
                first_row = seen_codes[lookup_key]
                raise ValueError(f"{path} has duplicate colorCode {code} at rows {first_row} and {index}")
            seen_codes[lookup_key] = index
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
        _lookup_code_key(row["colorCode"]): row for row in existing_rows if row.get("colorCode")
    }
    new_reference_rows: list[dict[str, str]] = []
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
        lookup_key = _lookup_code_key(code)
        canonical = canonical_map.get(lookup_key)
        duplicate_scrape = lookup_key in seen_scrape_codes
        seen_scrape_codes.add(lookup_key)

        if duplicate_scrape:
            match_status = "duplicate_skipped"
        elif lookup_key in reference_by_code:
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
            existing_reference_row = reference_by_code.get(lookup_key)
            if existing_reference_row and _should_replace_upc(existing_reference_row.get("upc", ""), product.barcode):
                existing_reference_row["upc"] = product.barcode or ""
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

        if lookup_key in reference_by_code:
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

        reference_row = {
            "colorCode": code,
            "colorName": canonical.color_name,
            "colorFamily": canonical.color_family,
            "hexRgb": canonical.hex_rgb,
            "isVariegated": "true" if canonical.is_variegated else "false",
            "threadSubtype": canonical.thread_subtype,
            "upc": product.barcode or canonical.upc or "",
        }
        reference_by_code[lookup_key] = reference_row
        new_reference_rows.append(reference_row)
        dedupe_report_rows.append(
            _dedupe_report_row(
                code=code,
                status="new_appended",
                reason="New colorCode with canonical metadata was appended to target reference CSV.",
                product=product,
                source_color_name=parsed.source_color_name,
            )
        )

    reference_rows = existing_rows + sorted(new_reference_rows, key=lambda row: _lookup_code_key(row["colorCode"]))
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


def _lookup_code_key(code: str) -> str:
    normalized = code.strip().upper()
    if normalized.isdigit():
        return str(int(normalized))
    return normalized


def _should_replace_upc(current_upc: str, candidate_upc: str | None) -> bool:
    candidate = (candidate_upc or "").strip()
    current = current_upc.strip()
    if not candidate:
        return False
    if not current:
        return True
    if current.isdigit() and candidate.isdigit():
        if len(current) != 12 and len(candidate) == 12:
            return True
        if len(candidate) > len(current):
            return True
    return False


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
