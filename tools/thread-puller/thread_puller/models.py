from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class RawProduct:
    catalog_id: str
    source: str
    collection_url: str
    product_url: str
    shopify_product_id: str | None
    shopify_variant_id: str | None
    handle: str
    title: str
    vendor: str | None
    product_type: str | None
    tags: list[str]
    sku: str | None
    barcode: str | None
    price_cents: int | None
    currency: str | None
    available: bool | None
    image_url: str | None
    description_text: str | None
    scraped_at: str

    def to_json(self) -> dict[str, Any]:
        return {
            "catalog_id": self.catalog_id,
            "source": self.source,
            "collection_url": self.collection_url,
            "product_url": self.product_url,
            "shopify_product_id": self.shopify_product_id,
            "shopify_variant_id": self.shopify_variant_id,
            "handle": self.handle,
            "title": self.title,
            "vendor": self.vendor,
            "product_type": self.product_type,
            "tags": self.tags,
            "sku": self.sku,
            "barcode": self.barcode,
            "price_cents": self.price_cents,
            "currency": self.currency,
            "available": self.available,
            "image_url": self.image_url,
            "description_text": self.description_text,
            "scraped_at": self.scraped_at,
        }


@dataclass(slots=True)
class NormalizedListing:
    catalog_id: str
    source: str
    color_code: str
    source_color_name: str
    canonical_color_name: str | None
    thread_subtype: str | None
    sku: str | None
    barcode: str | None
    price_cents: int | None
    currency: str | None
    available: bool | None
    product_url: str
    image_url: str | None
    matched_reference_color_id: str | None
    match_status: str
