from pathlib import Path

import pytest

from thread_puller.config import CatalogConfig
from thread_puller.models import RawProduct
from thread_puller.normalize import CanonicalRow, load_target_reference_rows, normalize_products


def _catalog() -> CatalogConfig:
    return CatalogConfig(
        id="dmc-pearl-cotton-5",
        manufacturer="DMC",
        product_line="Pearl Cotton Size 5",
        display_name="DMC Pearl Cotton Size 5",
        title_include_regex=r"^DMC\s+5\s+Pearl\s+Cotton\b",
        title_exclude_regex=r"^DMC\s+3\s+Pearl\s+Cotton\b",
        color_code_regex=r"^DMC\s+5\s+Pearl\s+Cotton\s+(?P<code>BLANC|ECRU|[A-Z]?\d{1,4})\b",
    )


def _product(code: str, name: str, *, sku: str | None = None, barcode: str | None = None) -> RawProduct:
    return RawProduct(
        catalog_id="dmc-pearl-cotton-5",
        source="pennylinn",
        collection_url="https://pennylinn.com/collections/dmc-5",
        product_url=f"https://pennylinn.com/products/dmc-5-pearl-cotton-{code.lower()}",
        shopify_product_id="1",
        shopify_variant_id="2",
        handle=f"dmc-5-pearl-cotton-{code.lower()}",
        title=f"DMC 5 Pearl Cotton {code} {name}",
        vendor="DMC",
        product_type="Thread",
        tags=[],
        sku=sku,
        barcode=barcode,
        price_cents=325,
        currency="USD",
        available=True,
        image_url=None,
        description_text=None,
        scraped_at="2026-05-09T00:00:00+00:00",
    )


def _canonical(code: str, name: str, *, upc: str | None = None) -> CanonicalRow:
    return CanonicalRow(
        color_code=code,
        color_name=name,
        color_family="Pink",
        hex_rgb="#FEDEDD",
        is_variegated=False,
        thread_subtype="solid",
        upc=upc,
    )


def _reference_row(code: str, name: str) -> dict[str, str]:
    return {
        "colorCode": code,
        "colorName": name,
        "colorFamily": "Pink",
        "hexRgb": "#FEDEDD",
        "isVariegated": "false",
        "threadSubtype": "solid",
        "upc": "",
    }


def test_normalize_products_appends_new_canonical_code() -> None:
    canonical = {"818": _canonical("818", "Baby Pink")}

    result = normalize_products([_product("818", "Powder Pink", sku="DMC5-818")], _catalog(), canonical, [])

    assert len(result.listings) == 1
    assert result.listings[0].match_status == "new"
    assert result.listings[0].canonical_color_name == "Baby Pink"
    assert result.reference_rows[0]["colorCode"] == "818"
    assert result.dedupe_report_rows[0]["status"] == "new_appended"


def test_normalize_products_preserves_existing_code_without_duplicate_append() -> None:
    canonical = {"818": _canonical("818", "Baby Pink")}
    existing = [_reference_row("818", "Baby Pink")]

    result = normalize_products([_product("818", "Powder Pink")], _catalog(), canonical, existing)

    assert result.listings[0].match_status == "existing"
    assert result.reference_rows == existing
    assert result.dedupe_report_rows[0]["status"] == "existing_skipped"


def test_normalize_products_reports_unmatched_code_without_append() -> None:
    result = normalize_products([_product("03", "Medium Gray")], _catalog(), {}, [])

    assert result.listings[0].match_status == "unmatched"
    assert result.unmatched_codes == ["03"]
    assert result.reference_rows == []
    assert result.dedupe_report_rows[0]["status"] == "unmatched"


def test_normalize_products_matches_unpadded_canonical_code_for_padded_scrape_code() -> None:
    canonical = {"3": _canonical("3", "Tin - Medium")}

    result = normalize_products([_product("03", "Medium Gray")], _catalog(), canonical, [])

    assert result.listings[0].match_status == "new"
    assert result.listings[0].canonical_color_name == "Tin - Medium"
    assert result.reference_rows[0]["colorCode"] == "03"
    assert result.dedupe_report_rows[0]["status"] == "new_appended"


def test_normalize_products_skips_duplicate_scrape_rows() -> None:
    products = [
        _product("818", "Powder Pink", sku="DMC5-818", barcode="111"),
        _product("818", "Powder Pink", sku="ALT-818", barcode="222"),
    ]
    canonical = {"818": _canonical("818", "Baby Pink")}

    result = normalize_products(products, _catalog(), canonical, [])

    assert [listing.match_status for listing in result.listings] == ["new", "duplicate_skipped"]
    assert [row["colorCode"] for row in result.reference_rows] == ["818"]
    assert result.dedupe_report_rows[1]["status"] == "duplicate_skipped"
    assert result.dedupe_report_rows[1]["sku"] == "ALT-818"


def test_normalize_products_uses_duplicate_with_better_upc_to_enrich_reference_row() -> None:
    products = [
        _product("806", "Fjord", sku="DMC5-806", barcode="07754003557"),
        _product("806", "Dark Peacock Blue", sku="KC-806", barcode="077540035557"),
    ]
    canonical = {"806": _canonical("806", "Peacock Blue - Dark")}

    result = normalize_products(products, _catalog(), canonical, [])

    assert [listing.match_status for listing in result.listings] == ["new", "duplicate_skipped"]
    assert result.reference_rows[0]["upc"] == "077540035557"


def test_load_target_reference_rows_rejects_duplicate_codes(tmp_path: Path) -> None:
    csv_path = tmp_path / "catalog.csv"
    csv_path.write_text(
        "\n".join(
            [
                "colorCode,colorName,colorFamily,hexRgb,isVariegated,threadSubtype,upc",
                "818,Baby Pink,Pink,#FEDEDD,false,solid,",
                "818,Baby Pink Duplicate,Pink,#FEDEDD,false,solid,",
            ]
        ),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="duplicate colorCode 818"):
        load_target_reference_rows(csv_path)


def test_load_target_reference_rows_rejects_padded_numeric_duplicates(tmp_path: Path) -> None:
    csv_path = tmp_path / "catalog.csv"
    csv_path.write_text(
        "\n".join(
            [
                "colorCode,colorName,colorFamily,hexRgb,isVariegated,threadSubtype,upc",
                "1,White Tin,Gray,#FEDEDD,false,solid,",
                "01,White Tin Duplicate,Gray,#FEDEDD,false,solid,",
            ]
        ),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="duplicate colorCode 01"):
        load_target_reference_rows(csv_path)
