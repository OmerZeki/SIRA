"""HTTP client for the SIRA worker API.

The robot uses three endpoints:
  - POST /api/workers/claim         -> claim the next PENDING job
  - GET  /api/workers/job/:jobId    -> fetch a specific job payload
  - POST /api/workers/webhook       -> report job result (HMAC-signed)
"""

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any, Dict, Optional

import requests


class SiraClient:
    def __init__(self, base_url: str, secret: str, timeout: int = 45):
        if not base_url:
            raise ValueError("SIRA_BASE_URL is required")
        if not secret:
            raise ValueError("WORKER_WEBHOOK_SECRET is required")
        self.base_url = base_url.rstrip("/")
        self.secret = secret
        self.timeout = timeout

    def _secret_headers(self) -> Dict[str, str]:
        return {"x-sira-worker-secret": self.secret}

    def claim(self, portal_id: Optional[str] = None, job_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Claim the oldest PENDING job. Returns the job payload or None."""
        body: Dict[str, str] = {}
        if portal_id:
            body["portalId"] = portal_id
        if job_type:
            body["jobType"] = job_type

        response = requests.post(
            f"{self.base_url}/api/workers/claim",
            json=body,
            headers=self._secret_headers(),
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json().get("job")

    def fetch(self, job_id: str) -> Dict[str, Any]:
        """Fetch a specific job payload by id."""
        response = requests.get(
            f"{self.base_url}/api/workers/job/{job_id}",
            headers=self._secret_headers(),
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def report(
        self,
        job_id: str,
        applicant_id: str,
        status: str,
        result_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Report a job result back to the SIRA webhook with an HMAC signature."""
        payload = {
            "jobId": job_id,
            "applicantId": applicant_id,
            "status": status,
            "resultData": result_data,
            "errorMessage": error_message,
        }
        # Sign the exact bytes we send so the server-side HMAC check matches.
        raw_body = json.dumps(payload, separators=(",", ":"))
        signature = hmac.new(
            self.secret.encode("utf-8"),
            raw_body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        response = requests.post(
            f"{self.base_url}/api/workers/webhook",
            data=raw_body,
            headers={
                "Content-Type": "application/json",
                "x-sira-worker-signature": f"sha256={signature}",
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()
