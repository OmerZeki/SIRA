"""Human-like interaction helpers for the SIRA software robot.

These wrap Playwright's sync API with small randomised delays, per-character
typing, and scroll-into-view so that automated form filling resembles a real
operator working in the browser rather than an instantaneous script.
"""

from __future__ import annotations

import random
import time
from typing import List, Optional

from playwright.sync_api import Locator, Page


def jitter(low: float = 0.2, high: float = 0.7) -> None:
    """Sleep for a short, randomised pause to mimic human reaction time."""
    time.sleep(random.uniform(low, high))


def _first_visible(page: Page, selectors: List[str], timeout: int = 2000) -> Optional[Locator]:
    """Return the first visible locator from a list of candidate selectors."""
    for selector in selectors:
        locator = page.locator(selector).first
        try:
            if locator.is_visible(timeout=timeout):
                return locator
        except Exception:
            continue
    return None


def _type_like_human(locator: Locator, value: str) -> None:
    delay = random.randint(40, 130)
    try:
        locator.press_sequentially(value, delay=delay)
    except AttributeError:  # older Playwright versions
        locator.type(value, delay=delay)


def fill(page: Page, selectors: List[str], value: str) -> bool:
    """Click into the first matching field and type the value like a human.

    Returns True when a field was found and filled, False otherwise.
    """
    if value is None:
        value = ""
    locator = _first_visible(page, selectors)
    if locator is None:
        print(f"[robot] field not found for selectors: {selectors}")
        return False

    try:
        locator.scroll_into_view_if_needed(timeout=2000)
    except Exception:
        pass

    jitter(0.1, 0.4)
    locator.click()
    jitter(0.1, 0.3)
    try:
        locator.fill("")  # clear any prefilled content
    except Exception:
        pass
    if value:
        _type_like_human(locator, value)
    jitter(0.1, 0.4)
    return True


def select(page: Page, selectors: List[str], value: str) -> bool:
    """Select a dropdown option by value, then fall back to label."""
    if not value:
        return False
    locator = _first_visible(page, selectors)
    if locator is None:
        return False

    jitter(0.1, 0.3)
    for attempt in ({"value": value}, {"label": value}):
        try:
            locator.select_option(**attempt)
            jitter(0.1, 0.3)
            return True
        except Exception:
            continue
    return False


def click(page: Page, selectors: List[str], timeout: int = 5000) -> bool:
    """Click the first visible matching element."""
    locator = _first_visible(page, selectors, timeout=timeout)
    if locator is None:
        return False
    jitter(0.2, 0.5)
    locator.click()
    return True


def text_of(page: Page, selectors: List[str], timeout: int = 3000) -> str:
    """Return the trimmed text content of the first matching element, or ''."""
    locator = _first_visible(page, selectors, timeout=timeout)
    if locator is None:
        return ""
    try:
        return (locator.text_content(timeout=timeout) or "").strip()
    except Exception:
        return ""
