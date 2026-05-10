from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Iterable

from .models import NormalizedListing, RawProduct


def write_raw_jsonl(path: Path, rows: Iterable[RawProduct]) -> None:
    _ensure_parent(path)
    with path.open("w", encoding="utf-8", newline="") as handle:
        for row in rows:
            handle.write(json.dumps(row.to_json(), ensure_ascii=False))
            handle.write("\n")


def write_normalized_csv(path: Path, listings: list[NormalizedListing]) -> None:
    _ensure_parent(path)
    fieldnames = [
        "catalogId",
        "source",
        "colorCode",
        "sourceColorName",
        "canonicalColorName",
        "threadSubtype",
        "sku",
        "barcode",
        "priceCents",
        "currency",
        "available",
        "productUrl",
        "imageUrl",
        "matchedReferenceColorId",
        "matchStatus",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for listing in listings:
            writer.writerow(
                {
                    "catalogId": listing.catalog_id,
                    "source": listing.source,
                    "colorCode": listing.color_code,
                    "sourceColorName": listing.source_color_name,
                    "canonicalColorName": listing.canonical_color_name or "",
                    "threadSubtype": listing.thread_subtype or "",
                    "sku": listing.sku or "",
                    "barcode": listing.barcode or "",
                    "priceCents": listing.price_cents if listing.price_cents is not None else "",
                    "currency": listing.currency or "",
                    "available": "" if listing.available is None else str(listing.available).lower(),
                    "productUrl": listing.product_url,
                    "imageUrl": listing.image_url or "",
                    "matchedReferenceColorId": listing.matched_reference_color_id or "",
                    "matchStatus": listing.match_status,
                }
            )


def write_unmatched_csv(path: Path, unmatched_codes: list[str]) -> None:
    _ensure_parent(path)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["colorCode"])
        writer.writeheader()
        for code in unmatched_codes:
            writer.writerow({"colorCode": code})


def write_reference_csv(path: Path, rows: list[dict[str, str]]) -> None:
    _ensure_parent(path)
    fieldnames = ["colorCode", "colorName", "colorFamily", "hexRgb", "isVariegated", "threadSubtype", "upc"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_dedupe_report_csv(path: Path, rows: list[dict[str, str]]) -> None:
    _ensure_parent(path)
    fieldnames = [
        "colorCode",
        "status",
        "reason",
        "source",
        "sourceColorName",
        "sku",
        "barcode",
        "priceCents",
        "currency",
        "available",
        "productUrl",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
