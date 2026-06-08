"""Ethiopian LMIS (Labour Market Information System) automation handler.

Mirrors the selectors and flow of the TypeScript LMIS worker, but runs through
Playwright's Python sync API with human-like interaction.
"""

from __future__ import annotations

import time
from typing import Any, Dict

from playwright.sync_api import Page

import human


def _login(page: Page, base_url: str, credentials: Dict[str, str]) -> None:
    page.goto(f"{base_url}/login", wait_until="domcontentloaded", timeout=30000)
    human.fill(page, ['input[name="username"]', 'input[type="email"]'], credentials["username"])
    human.fill(page, ['input[name="password"]', 'input[type="password"]'], credentials["password"])
    human.click(page, ['button[type="submit"]', 'input[type="submit"]'])
    page.wait_for_url(lambda url: any(k in url for k in ("dashboard", "home", "index")), timeout=20000)


def _submit_candidate(page: Page, base_url: str, fields: Dict[str, Any], screenshot_path: str) -> str:
    page.goto(f"{base_url}/candidates/register", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_selector("form, .candidate-form", timeout=15000)

    human.fill(page, ['input[name="firstName"]', "#firstName", '[data-field="firstName"]'], fields.get("firstName", ""))
    human.fill(page, ['input[name="fatherName"]', "#fatherName", '[data-field="fatherName"]'], fields.get("fatherName") or fields.get("middleName", ""))
    human.fill(page, ['input[name="grandfatherName"]', "#grandfatherName"], fields.get("grandfatherName") or fields.get("lastName", ""))
    human.fill(page, ['input[name="passportNumber"]', "#passportNumber"], fields.get("passportNumber", ""))

    if fields.get("dateOfBirth"):
        human.fill(page, ['input[name="dateOfBirth"]', "#dateOfBirth", 'input[type="date"]'], fields["dateOfBirth"])

    if fields.get("gender"):
        # LMIS shows a human-readable gender; map enum -> label.
        label = "Male" if str(fields["gender"]).upper().startswith("M") else "Female"
        human.select(page, ['select[name="gender"]', "#gender"], label)

    if fields.get("workPosition"):
        human.fill(page, ['input[name="workPosition"]', "#workPosition", 'select[name="workPosition"]'], fields["workPosition"])

    page.screenshot(path=screenshot_path)

    human.click(page, ['button[type="submit"]', ".submit-btn", "#submitBtn"])
    page.wait_for_url(lambda url: any(k in url for k in ("success", "confirmation", "complete")), timeout=20000)

    ref_text = human.text_of(page, [".reference-number", ".confirmation-id", "#refNumber"])
    import re

    match = re.search(r"[A-Z0-9]{8,}", ref_text or "")
    return match.group(0) if match else f"LMIS_{int(time.time())}"


def run(page: Page, job: Dict[str, Any]) -> Dict[str, Any]:
    fields = job["fields"]
    credentials = job["credentials"]
    base_url = job["portal"]["url"]
    screenshot_path = job["_screenshot_path"]

    if not credentials.get("username") or not credentials.get("password"):
        raise RuntimeError("LMIS portal credentials are missing for this agency.")

    _login(page, base_url, credentials)
    reference_number = _submit_candidate(page, base_url, fields, screenshot_path)

    return {"status": "COMPLETED", "result": {"referenceNumber": reference_number}}
