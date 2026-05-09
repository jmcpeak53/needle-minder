from thread_puller.parse import extract_embedded_product_json


def test_extract_embedded_product_json_decodes_payload() -> None:
    html = '<product-form product=3D"{&quot;id&quot;:7049354936377,&quot;title&quot;:&quot;DMC 5 Pearl Cotton 818 Powder Pink&quot;,&quot;variants&quot;:[{&quot;id&quot;:41302777888825,&quot;sku&quot;:&quot;DMC5-818&quot;}]}"></product-form>'
    payload = extract_embedded_product_json(html)
    assert payload is not None
    assert payload["id"] == 7049354936377
    assert payload["variants"][0]["sku"] == "DMC5-818"
