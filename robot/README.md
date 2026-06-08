# SIRA Software Robot (Python + Playwright)

A pull-based browser-automation robot that mimics a human operator submitting
candidates to government / visa portals on behalf of recruitment agencies. It is
fully decoupled from the SIRA Next.js app and talks to it only through the
worker HTTP API.

## How it connects

| Step | Endpoint | Auth |
| ---- | -------- | ---- |
| Claim next job | `POST /api/workers/claim` | `x-sira-worker-secret` |
| Fetch one job | `GET /api/workers/job/:jobId` | `x-sira-worker-secret` |
| Report result | `POST /api/workers/webhook` | `x-sira-worker-signature` (HMAC-SHA256) |

The claim/job endpoints return the portal metadata, **decrypted portal
credentials**, the candidate packet, and machine-friendly field values
(ISO dates). The result callback is signed with the same secret.

> `WORKER_WEBHOOK_SECRET` here **must** match the value in the SIRA app `.env`.

## Supported portals

| Portal id | Tier | Handler |
| --------- | ---- | ------- |
| `ethiopian_lmis` | Full background | logs in, registers candidate, captures reference |
| `tawtheeq_musaned` | Guided | logs in, prefills contract, captures contract number |
| `easyenjaz`, `tasheer` | Guided | opens + prefills, then `MANUAL_REQUIRED` for the agent |

> MOFA copy-paste jobs are created as `MANUAL_REQUIRED` by the app and are never
> claimed by the robot.

## Setup

```bash
cd robot
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
cp .env.example .env   # then fill SIRA_BASE_URL and WORKER_WEBHOOK_SECRET
```

## Run

```bash
python sira_robot.py --loop                       # keep polling for jobs
python sira_robot.py --once                        # run a single pending job
python sira_robot.py --job <jobId>                 # run one specific job
python sira_robot.py --loop --portal ethiopian_lmis --headful
```

Confirmation screenshots are written to `ROBOT_SCREENSHOT_DIR` (default
`./screenshots`).

## Human-like interaction

`human.py` wraps Playwright with randomised pauses, per-character typing, and
scroll-into-view so form filling resembles a real operator rather than an
instantaneous script.
