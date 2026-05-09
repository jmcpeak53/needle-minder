import re

from thread_puller.parse import parse_title


def test_parse_title_extracts_code_and_name() -> None:
    pattern = re.compile(r"^DMC\s+5\s+Pearl\s+Cotton\s+(?P<code>BLANC|ECRU|[A-Z]?\d{1,4})\b", re.IGNORECASE)
    parsed = parse_title("DMC 5 Pearl Cotton 818 Powder Pink", pattern)
    assert parsed.color_code == "818"
    assert parsed.source_color_name == "Powder Pink"


def test_parse_title_normalizes_code_alias() -> None:
    pattern = re.compile(r"^DMC\s+5\s+Pearl\s+Cotton\s+(?P<code>BLANC|ECRU|[A-Z]?\d{1,4})\b", re.IGNORECASE)
    parsed = parse_title("DMC 5 Pearl Cotton Ecru", pattern)
    assert parsed.color_code == "ECRU"
