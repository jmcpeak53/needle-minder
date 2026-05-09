from thread_puller.config import CatalogConfig
from thread_puller.models import RawProduct
from thread_puller.normalize import CanonicalRow, normalize_products


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


def test_normalize_products_matches_by_color_code() -> None:
    products = [
        RawProduct(
            catalog_id="dmc-pearl-cotton-5",
            source="pennylinn",
            collection_url="https://pennylinn.com/collections/dmc-5",
            product_url="https://pennylinn.com/products/dmc-5-pearl-cotton-818-baby-pink",
            shopify_product_id="1",
            shopify_variant_id="2",
            handle="dmc-5-pearl-cotton-818-baby-pink",
            title="DMC 5 Pearl Cotton 818 Powder Pink",
            vendor="DMC",
            product_type="Thread",
            tags=[],
            sku="DMC5-818",
            barcode="077540035632",
            price_cents=325,
            currency="USD",
            available=True,
            image_url=None,
            description_text=None,
            scraped_at="2026-05-09T00:00:00+00:00",
        )
    ]
    canonical = {
        "818": CanonicalRow(
            color_code="818",
            color_name="Baby Pink",
            color_family="Pink",
            hex_rgb="#FEDEDD",
            is_variegated=False,
            thread_subtype="solid",
            upc=None,
        )
    }

    result = normalize_products(products, _catalog(), canonical)
    assert len(result.listings) == 1
    assert result.listings[0].match_status == "matched"
    assert result.listings[0].canonical_color_name == "Baby Pink"
    assert result.reference_rows[0]["colorCode"] == "818"


def test_normalize_products_reports_unmatched_code() -> None:
    products = [
        RawProduct(
            catalog_id="dmc-pearl-cotton-5",
            source="pennylinn",
            collection_url="https://pennylinn.com/collections/dmc-5",
            product_url="https://pennylinn.com/products/dmc-5-pearl-cotton-03",
            shopify_product_id="1",
            shopify_variant_id="2",
            handle="dmc-5-pearl-cotton-03",
            title="DMC 5 Pearl Cotton 03 Medium Gray",
            vendor="DMC",
            product_type="Thread",
            tags=[],
            sku="DMC5-03",
            barcode=None,
            price_cents=325,
            currency="USD",
            available=True,
            image_url=None,
            description_text=None,
            scraped_at="2026-05-09T00:00:00+00:00",
        )
    ]

    result = normalize_products(products, _catalog(), {})
    assert result.unmatched_codes == ["03"]
    assert result.reference_rows == []
