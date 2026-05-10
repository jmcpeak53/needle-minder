from __future__ import annotations

from pathlib import Path
from typing import Iterable

import typer

from .config import ThreadPullerConfig, load_config
from .fetch import FetchSettings, ThrottledFetcher, ensure_allowed_by_robots
from .models import RawProduct
from .normalize import load_reference_rows, load_target_reference_rows, normalize_products
from .shopify import fetch_collection_refs, fetch_product_detail
from .write_outputs import (
    write_normalized_csv,
    write_dedupe_report_csv,
    write_raw_jsonl,
    write_reference_csv,
    write_unmatched_csv,
)

app = typer.Typer(help="Needle Minder thread catalog scraper")


@app.command()
def scrape(config: Path = typer.Option(..., exists=True, dir_okay=False)) -> None:
    cfg, repo_root = _load_config_and_root(config)
    products = _scrape_products(cfg)
    raw_path = _resolve_repo_path(repo_root, cfg.outputs.raw_jsonl)
    write_raw_jsonl(raw_path, products)
    typer.echo(f"Scraped {len(products)} products -> {raw_path}")


@app.command()
def normalize(config: Path = typer.Option(..., exists=True, dir_okay=False)) -> None:
    cfg, repo_root = _load_config_and_root(config)
    raw_path = _resolve_repo_path(repo_root, cfg.outputs.raw_jsonl)
    if not raw_path.exists():
        raise typer.BadParameter(f"Missing raw JSONL: {raw_path}. Run scrape first.")

    products = list(_read_raw_jsonl(raw_path))
    canonical = load_reference_rows(_resolve_repo_path(repo_root, cfg.reference_match.existing_csv))
    target_reference_path = _resolve_repo_path(repo_root, cfg.outputs.reference_csv)
    target_reference_rows = load_target_reference_rows(target_reference_path)
    result = normalize_products(products, cfg.catalog, canonical, target_reference_rows)

    write_normalized_csv(_resolve_repo_path(repo_root, cfg.outputs.normalized_csv), result.listings)
    write_unmatched_csv(_resolve_repo_path(repo_root, cfg.outputs.unmatched_csv), result.unmatched_codes)
    write_reference_csv(target_reference_path, result.reference_rows)
    write_dedupe_report_csv(_resolve_repo_path(repo_root, cfg.outputs.dedupe_report_csv), result.dedupe_report_rows)
    typer.echo(
        f"Normalized {len(result.listings)} listings, {len(result.reference_rows)} reference rows, "
        f"{len(result.unmatched_codes)} unmatched codes, {len(result.dedupe_report_rows)} dedupe report rows"
    )


@app.command()
def run(config: Path = typer.Option(..., exists=True, dir_okay=False)) -> None:
    scrape(config)
    normalize(config)


def _scrape_products(cfg: ThreadPullerConfig) -> list[RawProduct]:
    settings = FetchSettings(
        user_agent=cfg.scrape.user_agent,
        timeout_seconds=cfg.scrape.request_timeout_seconds,
        min_delay_seconds=cfg.scrape.min_delay_seconds,
        max_retries=cfg.scrape.max_retries,
    )
    products: list[RawProduct] = []
    fetcher = ThrottledFetcher(settings)
    try:
        for source in cfg.sources:
            ensure_allowed_by_robots(
                base_url=str(source.base_url),
                targets=[str(source.collection_url)],
                user_agent=cfg.scrape.user_agent,
            )
            refs = fetch_collection_refs(fetcher, source)
            for ref in refs:
                product = fetch_product_detail(fetcher, cfg.catalog, source, ref)
                products.append(product)
    finally:
        fetcher.close()
    return products


def _load_config_and_root(config_path: Path) -> tuple[ThreadPullerConfig, Path]:
    cfg = load_config(config_path)
    repo_root = _find_repo_root(config_path.parent)
    return cfg, repo_root


def _find_repo_root(start: Path) -> Path:
    for candidate in [start, *start.parents]:
        if (candidate / "package.json").exists():
            return candidate
    return Path.cwd()


def _resolve_repo_path(repo_root: Path, value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return (repo_root / path).resolve()


def _read_raw_jsonl(path: Path) -> Iterable[RawProduct]:
    import json

    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        data = json.loads(line)
        yield RawProduct(
            catalog_id=data["catalog_id"],
            source=data["source"],
            collection_url=data["collection_url"],
            product_url=data["product_url"],
            shopify_product_id=data.get("shopify_product_id"),
            shopify_variant_id=data.get("shopify_variant_id"),
            handle=data["handle"],
            title=data["title"],
            vendor=data.get("vendor"),
            product_type=data.get("product_type"),
            tags=list(data.get("tags") or []),
            sku=data.get("sku"),
            barcode=data.get("barcode"),
            price_cents=data.get("price_cents"),
            currency=data.get("currency"),
            available=data.get("available"),
            image_url=data.get("image_url"),
            description_text=data.get("description_text"),
            scraped_at=data["scraped_at"],
        )


if __name__ == "__main__":
    app()
