from __future__ import annotations

import time
from dataclasses import dataclass
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx


@dataclass(slots=True)
class FetchSettings:
    user_agent: str
    timeout_seconds: int
    min_delay_seconds: float
    max_retries: int


class ThrottledFetcher:
    def __init__(self, settings: FetchSettings) -> None:
        self._settings = settings
        self._client = httpx.Client(
            headers={"User-Agent": settings.user_agent},
            timeout=settings.timeout_seconds,
            follow_redirects=True,
        )
        self._last_request_at = 0.0

    def close(self) -> None:
        self._client.close()

    def get_json(self, url: str) -> dict:
        return self._request("GET", url).json()

    def get_text(self, url: str) -> str:
        return self._request("GET", url).text

    def _request(self, method: str, url: str) -> httpx.Response:
        retries = self._settings.max_retries + 1
        last_error: Exception | None = None
        for _ in range(retries):
            self._wait_for_min_delay()
            try:
                response = self._client.request(method, url)
                response.raise_for_status()
                return response
            except Exception as error:  # pragma: no cover - network behavior
                last_error = error
                time.sleep(0.5)
        assert last_error is not None
        raise last_error

    def _wait_for_min_delay(self) -> None:
        elapsed = time.monotonic() - self._last_request_at
        remaining = self._settings.min_delay_seconds - elapsed
        if remaining > 0:
            time.sleep(remaining)
        self._last_request_at = time.monotonic()


def ensure_allowed_by_robots(base_url: str, targets: list[str], user_agent: str) -> None:
    parsed = urlparse(base_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    parser = RobotFileParser(robots_url)
    parser.read()
    blocked = [url for url in targets if not parser.can_fetch(user_agent, url)]
    if blocked:
        joined = ", ".join(blocked)
        raise RuntimeError(f"robots.txt disallows configured URL(s): {joined}")
