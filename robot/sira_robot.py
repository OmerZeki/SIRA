#!/usr/bin/env python3
"""SIRA Software Robot
=====================

A pull-based browser-automation robot that mimics a human operator filling
government / visa portals (Ethiopian LMIS, Tawtheeq Musaned, EasyEnjaz, Tasheer)
on behalf of recruitment agencies.

Flow
----
1. Claim a PENDING automation job from the SIRA app:  POST /api/workers/claim
   (or fetch a specific job with --job <id>).
2. Launch Playwright Chromium and run the matching portal handler, filling the
   forms with human-like typing and pauses.
3. Report the result back (COMPLETED / FAILED / MANUAL_REQUIRED) via an
   HMAC-signed callback to /api/workers/webhook.

Usage
-----
    python sira_robot.py --loop                 # keep polling for jobs
    python sira_robot.py --once                 # claim & run a single job, exit
    python sira_robot.py --job <jobId>          # run one specific job
    python sira_robot.py --loop --portal ethiopian_lmis --headful

Environment (see .env.example): SIRA_BASE_URL, WORKER_WEBHOOK_SECRET, ...
"""

from __future__ import annotations

import argparse
import os
import sys
import time
import traceback
from typing import Any, Dict, Optional

# Ensure sibling modules (human, client, portals) are importable when this file
# is run directly from any working directory.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from dotenv import load_dotenv  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

from client import SiraClient  # noqa: E402
from portals import get_handler  # noqa: E402

load_dotenv(os.path.join(SCRIPT_DIR, ".env"))

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def _bool_env(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


def _screenshot_path(screenshot_dir: str, job_id: str) -> str:
    os.makedirs(screenshot_dir, exist_ok=True)
    return os.path.join(screenshot_dir, f"job_{job_id}.png")


def run_job(client: SiraClient, job: Dict[str, Any], *, headful: bool, screenshot_dir: str) -> None:
    job_id = job["jobId"]
    applicant_id = job["applicantId"]
    portal = job["portal"]
    handler = get_handler(portal["id"])
    job["_screenshot_path"] = _screenshot_path(screenshot_dir, job_id)

    print(f"[robot] running job {job_id} -> {portal['name']} ({portal['automationTier']})")

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=not headful,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )
        context = browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1366, "height": 768},
            locale="en-US",
        )
        page = context.new_page()
        page.set_default_timeout(30000)

        try:
            outcome = handler(page, job)
            status = outcome.get("status", "COMPLETED")
            result = outcome.get("result", {})
            client.report(job_id, applicant_id, status, result_data=result)
            print(f"[robot] job {job_id} -> {status}")
        except Exception as error:  # noqa: BLE001
            message = f"{type(error).__name__}: {error}"
            print(f"[robot] job {job_id} FAILED: {message}")
            traceback.print_exc()
            try:
                client.report(job_id, applicant_id, "FAILED", error_message=message)
            except Exception as report_error:  # noqa: BLE001
                print(f"[robot] failed to report failure: {report_error}")
        finally:
            context.close()
            browser.close()


def claim_and_run(client: SiraClient, *, portal_id: Optional[str], headful: bool, screenshot_dir: str) -> bool:
    """Claim one job and run it. Returns True if a job was processed."""
    job = client.claim(portal_id=portal_id)
    if not job:
        return False
    run_job(client, job, headful=headful, screenshot_dir=screenshot_dir)
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="SIRA software robot (Playwright)")
    parser.add_argument("--loop", action="store_true", help="Continuously poll for jobs")
    parser.add_argument("--once", action="store_true", help="Claim and run a single job, then exit")
    parser.add_argument("--job", help="Run a specific job id (fetched from the API)")
    parser.add_argument("--portal", default=os.getenv("ROBOT_PORTAL") or None, help="Restrict to a portal id")
    parser.add_argument("--headful", action="store_true", default=_bool_env("ROBOT_HEADFUL"), help="Show the browser window")
    parser.add_argument("--poll-interval", type=float, default=float(os.getenv("ROBOT_POLL_INTERVAL", "10")))
    args = parser.parse_args()

    base_url = os.getenv("SIRA_BASE_URL", "http://localhost:3000")
    secret = os.getenv("WORKER_WEBHOOK_SECRET", "")
    screenshot_dir = os.getenv("ROBOT_SCREENSHOT_DIR", os.path.join(SCRIPT_DIR, "screenshots"))

    try:
        client = SiraClient(base_url, secret)
    except ValueError as error:
        print(f"[robot] configuration error: {error}")
        return 2

    if args.job:
        job = client.fetch(args.job)
        run_job(client, job, headful=args.headful, screenshot_dir=screenshot_dir)
        return 0

    if args.loop:
        print(f"[robot] polling {base_url} every {args.poll_interval}s (portal={args.portal or 'any'})")
        while True:
            try:
                processed = claim_and_run(client, portal_id=args.portal, headful=args.headful, screenshot_dir=screenshot_dir)
                if not processed:
                    time.sleep(args.poll_interval)
            except KeyboardInterrupt:
                print("\n[robot] stopped")
                return 0
            except Exception as error:  # noqa: BLE001
                print(f"[robot] poll error: {error}")
                time.sleep(args.poll_interval)

    # Default / --once: process a single job.
    processed = claim_and_run(client, portal_id=args.portal, headful=args.headful, screenshot_dir=screenshot_dir)
    if not processed:
        print("[robot] no pending jobs available")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
