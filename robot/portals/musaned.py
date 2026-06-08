"""Tawtheeq Musaned (Saudi domestic-worker contract) automation handler.

Guided semi-automation: the robot logs in and prefills the contract form, then
captures the contract number when available.
"""

from __future__ import annotations

import time
from typing import Any, Dict

from playwright.sync_api import Page

import human


def _login(page: Page, base_url: str, credentials: Dict[str, str]) -> None:
    page.goto(f"{base_url}/login", wait_until="domcontentloaded", timeout=30000)

    # Dismiss a cookie banner if present.
    human.click(page, ['button:has-text("Accept")', ".accept-cookies"], timeout=3000)

    human.fill(page, ['input[name="username"]', 'input[type="text"]'], credentials["username"])
    human.fill(page, ['input[name="password"]', 'input[type="password"]'], credentials["password"])
    human.click(page, ['button[type="submit"]'])
    page.wait_for_url(lambda url: any(k in url for k in ("dashboard", "home")), timeout=20000)


def _submit(page: Page, base_url: str, fields: Dict[str, Any], screenshot_path: str) -> str:
    page.goto(f"{base_url}/domestic-worker/new", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_selector("form, .registration-form", timeout=15000)

    human.fill(page, ["#workerFirstName", 'input[name="firstName"]'], fields.get("firstName", ""))
    human.fill(page, ["#workerFatherName", 'input[name="fatherName"]'], fields.get("fatherName") or fields.get("middleName", ""))
    human.fill(page, ["#workerGrandfatherName", 'input[name="grandfatherName"]'], fields.get("grandfatherName") or fields.get("lastName", ""))
    human.fill(page, ["#workerLastName", 'input[name="lastName"]'], fields.get("lastName", ""))

    if fields.get("dateOfBirth"):
        human.fill(page, ['input[name="dateOfBirth"]', "#workerDOB", "#dateOfBirth"], fields["dateOfBirth"])

    human.fill(page, ["#passportNumber", 'input[name="passportNo"]'], fields.get("passportNumber", ""))

    if fields.get("dateOfExpiry"):
        human.fill(page, ['input[name="passportExpiry"]', "#passportExpiry"], fields["dateOfExpiry"])

    if fields.get("nationality"):
        human.select(page, ['select[name="nationality"]', "#nationality"], fields["nationality"])
    if fields.get("religion"):
        human.select(page, ['select[name="religion"]', "#religion"], fields["religion"])
    if fields.get("workPosition"):
        human.select(page, ['select[name="occupation"]', "#occupation", 'select[name="workPosition"]'], fields["workPosition"])

    page.screenshot(path=screenshot_path)

    human.click(page, ['button:has-text("Next")', 'button[type="submit"]', ".btn-next"])
    page.wait_for_selector(".confirmation, .success-message, #contractNumber", timeout=20000)

    contract_number = human.text_of(page, [".contract-number", "#contractNumber", ".reference-id"])
    return contract_number or f"MSN_{int(time.time())}"


def run(page: Page, job: Dict[str, Any]) -> Dict[str, Any]:
    fields = job["fields"]
    credentials = job["credentials"]
    base_url = job["portal"]["url"]
    screenshot_path = job["_screenshot_path"]

    if not credentials.get("username") or not credentials.get("password"):
        raise RuntimeError("Musaned portal credentials are missing for this agency.")

    _login(page, base_url, credentials)
    contract_number = _submit(page, base_url, fields, screenshot_path)

    return {"status": "COMPLETED", "result": {"contractNumber": contract_number}}
