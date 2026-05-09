from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

from .config import CatalogConfig, SourceConfig
from .fetch import ThrottledFetcher
from .models import RawProduct
from .parse import extract_embedded_product_json


@dataclass(slots=True)
class ShopifyProductRef:
    handle: str
    product_url: str


def fetch_collection_refs(fetcher: ThrottledFetcher, source: SourceConfig) -> list[ShopifyProductRef]:
    parsed = urlparse(str(source.collection_url))
    base_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}/products.json?limit=250&page="
    refs: list[ShopifyProductRef] = []
    seen_handles: set[str] = set()
    page = 1

    while True:
        payload = fetcher.get_json(f"{base_url}{page}")
        products = payload.get("products", [])
        if not products:
            break

        added = 0
        for product in products:
            handle = str(product.get("handle", "")).strip()
            if not handle or handle in seen_handles:
                continue
            refs.append(
                ShopifyProductRef(
                    handle=handle,
                    product_url=f"{source.base_url}/products/{handle}",
                )
            )
            seen_handles.add(handle)
            added += 1

        if added == 0:
            break
        page += 1

    return refs


def fetch_product_detail(
    fetcher: ThrottledFetcher,
    catalog: CatalogConfig,
    source: SourceConfig,
    ref: ShopifyProductRef,
) -> RawProduct:
    product_json_url = f"{source.base_url}/products/{ref.handle}.js"
    product_json = fetcher.get_json(product_json_url)

    variant = _choose_variant(product_json)
    if variant is None:
        html_text = fetcher.get_text(ref.product_url)
        embedded = extract_embedded_product_json(html_text)
        if not embedded:
            raise RuntimeError(f"missing variant payload for {ref.handle}")
        product_json = embedded
        variant = _choose_variant(product_json)
        if variant is None:
            raise RuntimeError(f"missing variant for {ref.handle}")

    image_url = None
    if isinstance(product_json.get("image"), dict):
        image_url = product_json["image"].get("src")
    if not image_url:
        images = product_json.get("images") or []
        if images:
            image_url = images[0]

    description_html = str(product_json.get("body_html") or "").strip()
    description_text = _strip_html(description_html)
    scraped_at = datetime.now(UTC).isoformat()
    price_cents = _to_cents(variant.get("price"))

    return RawProduct(
        catalog_id=catalog.id,
        source=source.id,
        collection_url=str(source.collection_url),
        product_url=ref.product_url,
        shopify_product_id=_to_str_or_none(product_json.get("id")),
        shopify_variant_id=_to_str_or_none(variant.get("id")),
        handle=ref.handle,
        title=str(product_json.get("title") or "").strip(),
        vendor=_to_str_or_none(product_json.get("vendor")),
        product_type=_to_str_or_none(product_json.get("product_type")),
        tags=_normalize_tags(product_json.get("tags")),
        sku=_to_str_or_none(variant.get("sku")),
        barcode=_to_str_or_none(variant.get("barcode")),
        price_cents=price_cents,
        currency=source.currency,
        available=_to_bool_or_none(variant.get("available")),
        image_url=image_url,
        description_text=description_text,
        scraped_at=scraped_at,
    )


def _choose_variant(product_json: dict[str, Any]) -> dict[str, Any] | None:
    variants = product_json.get("variants")
    if not isinstance(variants, list) or not variants:
        return None
    preferred = next((variant for variant in variants if variant.get("available") is True), None)
    return preferred or variants[0]


def _normalize_tags(value: Any) -> list[str]:
    if isinstance(value, str):
        return [tag.strip() for tag in value.split(",") if tag.strip()]
    if isinstance(value, list):
        return [str(tag).strip() for tag in value if str(tag).strip()]
    return []


def _to_cents(price_value: Any) -> int | None:
    if price_value is None:
        return None
    if isinstance(price_value, int):
        return price_value
    text = str(price_value).strip()
    if not text:
        return None
    if text.isdigit():
        return int(text)
    return int(round(float(text) * 100))


def _to_str_or_none(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _to_bool_or_none(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if value in (0, 1):
        return bool(value)
    return None


def _strip_html(value: str) -> str:
    text = value.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
    chunks: list[str] = []
    in_tag = False
    for char in text:
        if char == "<":
            in_tag = True
            continue
        if char == ">":
            in_tag = False
            continue
        if not in_tag:
            chunks.append(char)
    return " ".join("".join(chunks).split())
