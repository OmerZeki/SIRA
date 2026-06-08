"""Portal handler registry for the SIRA software robot.

Each handler exposes `run(page, job) -> dict` where the returned dict has the
shape `{"status": <AutomationStatus>, "result": {...}}`. Portals without a
dedicated handler fall back to the generic guided handler.
"""

from __future__ import annotations

from typing import Callable

from .generic import run as run_generic
from .lmis import run as run_lmis
from .musaned import run as run_musaned

HANDLERS: dict[str, Callable] = {
    "ethiopian_lmis": run_lmis,
    "tawtheeq_musaned": run_musaned,
}


def get_handler(portal_id: str) -> Callable:
    return HANDLERS.get(portal_id, run_generic)
