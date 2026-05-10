from __future__ import annotations

from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field, HttpUrl


class CatalogConfig(BaseModel):
    id: str
    manufacturer: str
    product_line: str
    display_name: str
    title_include_regex: str
    title_exclude_regex: str
    color_code_regex: str


class ReferenceMatchConfig(BaseModel):
    existing_csv: str
    require_match_for_reference_export: bool = True
    unmatched_policy: Literal["report_only"] = "report_only"


class OutputsConfig(BaseModel):
    raw_jsonl: str
    normalized_csv: str
    unmatched_csv: str
    reference_csv: str
    dedupe_report_csv: str


class ScrapeConfig(BaseModel):
    user_agent: str
    request_timeout_seconds: int = Field(20, ge=1)
    min_delay_seconds: float = Field(1.0, ge=0)
    max_retries: int = Field(3, ge=0)
    prefer_shopify_json: bool = True


class SourceConfig(BaseModel):
    id: str
    base_url: HttpUrl
    collection_url: HttpUrl
    platform: Literal["shopify"] = "shopify"
    currency: str = "USD"


class ThreadPullerConfig(BaseModel):
    catalog: CatalogConfig
    reference_match: ReferenceMatchConfig
    outputs: OutputsConfig
    scrape: ScrapeConfig
    sources: list[SourceConfig]


def load_config(path: Path) -> ThreadPullerConfig:
    payload = yaml.safe_load(path.read_text(encoding="utf-8"))
    return ThreadPullerConfig.model_validate(payload)
