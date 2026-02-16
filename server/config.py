from __future__ import annotations

import os
from pathlib import Path

# -----------------------------------------------------------------------------
# Server configuration
# -----------------------------------------------------------------------------
# Goal: keep constants out of route files. Configure via environment variables.
#
# Typical usage:
#   DEV (laptop): set SPARES_ENV=dev
#   RPi (prod):   leave default (prod) or set SPARES_ENV=prod
#
# Export directories:
#   - In prod, export to USB if detected; otherwise fall back to PROD_LOCAL_EXPORTS
#   - In dev, export to DEV_LOCAL_EXPORTS (no USB expected)
# -----------------------------------------------------------------------------

APP_NAME = "Roboard"

SPARES_ENV = os.getenv("SPARES_ENV", "prod").lower()  # "dev" or "prod"

# Local export roots (override with env vars if you want)
DEV_LOCAL_EXPORTS = Path(os.getenv("DEV_LOCAL_EXPORTS", "./spares_exports_dev"))
PROD_LOCAL_EXPORTS = Path(os.getenv("PROD_LOCAL_EXPORTS", "/home/mambo/Documents"))

# Subfolder used within the chosen export root
EXPORT_SUBDIR = os.getenv("SPARES_EXPORT_SUBDIR", "spares_exports")

def get_export_dir(usb_mount: Path | None) -> Path:
    """Return the folder where exports should be written."""
    if SPARES_ENV == "dev":
        return DEV_LOCAL_EXPORTS / EXPORT_SUBDIR
    # prod
    if usb_mount is not None:
        return usb_mount / EXPORT_SUBDIR
    return PROD_LOCAL_EXPORTS / EXPORT_SUBDIR
