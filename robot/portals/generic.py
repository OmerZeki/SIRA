"""Generic guided handler for portals without dedicated automation.

Used for EasyEnjaz, Tasheer and any other GUIDED_SEMI_AUTOMATION portal. The
robot opens the portal, best-effort prefills any recognisable fields, captures a
screenshot, and hands control back to a human operator by reporting
MANUAL_REQUIRED (the agent finishes CAPTCHA / payment / appointment steps).
"""

from __future__ import annotations

from typing import Any, Dict

from playwright.sync_api import Page

import human

# Common field selector groups keyed by the worker payload field name.
_COMMON_FIELDS = {
    "firstName": ['input[name="firstName"]', "#firstName"],
    "lastName": ['input[name="lastName"]', "#lastName"],
    "passportNumber": ['input[name="passportNumber"]', "#passportNumber", 'input[name="passportNo"]'],
    "dateOfBirth": ['input[name="dateOfBirth"]', "#dateOfBirth"],
    "dateOfExpiry": ['input[name="passportExpiry"]', "#passportExpiry"],
    "nationality": ['input[name="nationality"]', "#nationality"],
    "phone": ['input[name="phone"]', "#phone"],
}


def run(page: Page, job: Dict[str, Any]) -> Dict[str, Any]:
    portal = job["portal"]
    fields = job["fields"]
    screenshot_path = job["_screenshot_path"]

    page.goto(portal["url"], wait_until="domcontentloaded", timeout=45000)
    page.wait_for_timeout(1500)

    prefilled = []
    for key, selectors in _COMMON_FIELDS.items():
        value = fields.get(key)
        if value and human.fill(page, selectors, value):
            prefilled.append(key)

    page.screenshot(path=screenshot_path)

    return {
        "status": "MANUAL_REQUIRED",
        "result": {
            "portalId": portal["id"],
            "message": (
                f"{portal['name']} form opened and prefilled. "
                "Agent must complete CAPTCHA / payment / appointment steps manually."
            ),
            "prefilledFields": prefilled,
            "fallback": portal.get("fallback"),
        },
    }
