from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass
from typing import Any

from bs4 import BeautifulSoup


_PRODUCT_FORM_RE = re.compile(r"<product-form\s+product=3D\"(?P<payload>\{.+?\})\"", re.DOTALL)
_CODE_NORMALIZE = {"ECRU": "ECRU", "BLANC": "BLANC"}


@dataclass(slots=True)
class ParsedTitle:
    color_code: str | None
    source_color_name: str


def parse_title(title: str, color_code_pattern: re.Pattern[str]) -> ParsedTitle:
    normalized = " ".join(title.split())
    match = color_code_pattern.search(normalized)
    color_code = None
    source_name = normalized

    if match:
        raw_code = match.group("code").upper()
        color_code = normalize_color_code(raw_code)
        source_name = normalized[match.end() :].strip(" -")

    return ParsedTitle(color_code=color_code, source_color_name=source_name or normalized)


def normalize_color_code(value: str) -> str:
    token = value.strip().upper()
    if token in _CODE_NORMALIZE:
        return _CODE_NORMALIZE[token]
    if token.isdigit():
        return token
    return token


def extract_pennylinn_collection_handles(html_text: str) -> list[str]:
    handles: list[str] = []
    soup = BeautifulSoup(html_text, "lxml")
    for anchor in soup.select("a.product-card__title, a.product-card__link"):
        href = anchor.get("href") or ""
        if "/products/" not in href:
            continue
        handle = href.split("/products/")[-1].split("?")[0].strip("/")
        if handle and handle not in handles:
            handles.append(handle)
    return handles


def extract_embedded_product_json(html_text: str) -> dict[str, Any] | None:
    match = _PRODUCT_FORM_RE.search(html_text)
    if not match:
        return None
    payload = html.unescape(match.group("payload"))
    return json.loads(payload)
