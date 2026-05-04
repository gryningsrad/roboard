from pathlib import Path
import re
import sqlite3
from datetime import datetime
# from io import BytesIO
import sys
import os

# Add the parent directory to sys.path to import from app.py
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, HTTPException
# from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openpyxl import Workbook

from app import SPARES_ENV, get_export_dir, find_usb_mount


DB_PATH = Path("app.db")

router = APIRouter(prefix="/api/ean-overrides", tags=["EAN Overrides"])

class EanOverrideCreate(BaseModel):
    ean: str
    source: str | None = "manual"
    note: str | None = None


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def normalize_ean(value: str) -> str:
    """
    Keep digits only.
    Accept EAN-8 and EAN-13.
    """
    if not value:
        raise HTTPException(status_code=400, detail="EAN is required")

    ean = re.sub(r"\D", "", value)

    if len(ean) not in (8, 13):
        raise HTTPException(
            status_code=400,
            detail="EAN must be 8 or 13 digits"
        )

    return ean


@router.post("/{part_number}")
def register_ean_override(part_number: str, payload: EanOverrideCreate):
    ean = normalize_ean(payload.ean)
    now = datetime.now().isoformat(timespec="seconds")

    with get_conn() as conn:
        part = conn.execute(
            "SELECT number FROM parts WHERE number = ?;",
            (part_number,)
        ).fetchone()

        if not part:
            raise HTTPException(status_code=404, detail="Part not found")

        existing = conn.execute(
            """
            SELECT id, part_number
            FROM part_ean_overrides
            WHERE ean = ?;
            """,
            (ean,)
        ).fetchone()

        if existing and existing["part_number"] != part_number:
            raise HTTPException(
                status_code=409,
                detail=f"EAN already registered to part {existing['part_number']}"
            )

        conn.execute(
            "DELETE FROM part_ean_overrides WHERE part_number = ?;",
            (part_number,)
        )

        cur = conn.execute(
            """
            INSERT INTO part_ean_overrides (
                part_number,
                ean,
                source,
                note,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            (
                part_number,
                ean,
                payload.source,
                payload.note,
                now,
                now,
            )
        )

        conn.commit()

        return {
            "id": cur.lastrowid,
            "part_number": part_number,
            "ean": ean,
            "source": payload.source,
            "note": payload.note,
            "created_at": now,
            "updated_at": now,
        }


@router.get("/{part_number}")
def list_ean_overrides_for_part(part_number: str):
    with get_conn() as conn:
        part = conn.execute(
            """
            SELECT number, name, ean
            FROM parts
            WHERE number = ?;
            """,
            (part_number,)
        ).fetchone()

        if not part:
            raise HTTPException(status_code=404, detail="Part not found")

        rows = conn.execute(
            """
            SELECT id, part_number, ean, source, note, created_at, updated_at
            FROM part_ean_overrides
            WHERE part_number = ?
            ORDER BY created_at DESC;
            """,
            (part_number,)
        ).fetchall()

        return {
            "part": dict(part),
            "overrides": [dict(row) for row in rows],
        }


@router.delete("/{ean_id}")
def delete_ean_override(ean_id: int):
    with get_conn() as conn:
        existing = conn.execute(
            """
            SELECT id, part_number, ean
            FROM part_ean_overrides
            WHERE id = ?;
            """,
            (ean_id,)
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="EAN override not found")

        conn.execute(
            "DELETE FROM part_ean_overrides WHERE id = ?;",
            (ean_id,)
        )

        conn.commit()

        return {
            "deleted": True,
            "id": existing["id"],
            "part_number": existing["part_number"],
            "ean": existing["ean"],
        }


@router.post("/delete/{part_number}")
def delete_ean_override_by_part(part_number: str):
    part_number = (part_number or "").strip()
    if not part_number:
        raise HTTPException(status_code=400, detail="part_number is required")

    with get_conn() as conn:
        existing = conn.execute(
            "SELECT 1 FROM part_ean_overrides WHERE part_number = ? LIMIT 1",
            (part_number,),
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="EAN override not found")

        conn.execute("DELETE FROM part_ean_overrides WHERE part_number = ?", (part_number,))
        conn.commit()
        return {"ok": True, "part_number": part_number, "deleted": True}


@router.get("/search/{ean}")
def search_by_ean(ean: str):
    normalized = normalize_ean(ean)

    with get_conn() as conn:
        override = conn.execute(
            """
            SELECT
                peo.id,
                peo.part_number,
                peo.ean,
                peo.source,
                peo.note,
                peo.created_at,
                peo.updated_at,
                p.name,
                p.unit,
                p.default_location,
                p.ean AS amos_ean
            FROM part_ean_overrides peo
            JOIN parts p ON p.number = peo.part_number
            WHERE peo.ean = ?;
            """,
            (normalized,)
        ).fetchone()

        if override:
            return {
                "match_type": "override",
                "result": dict(override),
            }

        amos = conn.execute(
            """
            SELECT
                number AS part_number,
                name,
                unit,
                default_location,
                ean AS amos_ean
            FROM parts
            WHERE ean = ?;
            """,
            (normalized,)
        ).fetchone()

        if amos:
            return {
                "match_type": "amos",
                "result": dict(amos),
            }

        raise HTTPException(status_code=404, detail="EAN not found")


@router.get("/")
def list_ean_overrides(q: str = "", limit: int = 200):
    q = (q or "").strip()
    limit = max(1, min(int(limit or 200), 500))

    with get_conn() as conn:
        if q:
            rows = conn.execute(
                """
                SELECT p.*,
                    EXISTS(SELECT 1 FROM wishlist w WHERE w.part_number = p.number) AS wishlisted,
                    r.rob AS rob,
                    r.updated_at AS rob_updated_at,
                    lo.new_location AS overridden_location,
                    lo.note AS location_note,
                    lo.updated_at AS location_updated_at,
                    p.ean AS original_ean,
                    peo.ean AS override_ean,
                    peo.updated_at AS ean_updated_at
                FROM part_ean_overrides peo
                JOIN parts p ON p.number = peo.part_number
                LEFT JOIN rob r ON r.part_number = p.number
                LEFT JOIN location_overrides lo ON lo.part_number = p.number
                WHERE peo.part_number LIKE ? OR p.name LIKE ? OR peo.ean LIKE ?
                ORDER BY peo.updated_at DESC
                LIMIT ?
                """,
                (f"%{q}%", f"%{q}%", f"%{q}%", limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT p.*,
                    EXISTS(SELECT 1 FROM wishlist w WHERE w.part_number = p.number) AS wishlisted,
                    r.rob AS rob,
                    r.updated_at AS rob_updated_at,
                    lo.new_location AS overridden_location,
                    lo.note AS location_note,
                    lo.updated_at AS location_updated_at,
                    p.ean AS original_ean,
                    peo.ean AS override_ean,
                    peo.updated_at AS ean_updated_at
                FROM part_ean_overrides peo
                JOIN parts p ON p.number = peo.part_number
                LEFT JOIN rob r ON r.part_number = p.number
                LEFT JOIN location_overrides lo ON lo.part_number = p.number
                ORDER BY peo.updated_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [dict(row) for row in rows]


@router.post("/export")
def export_ean_overrides():
    # from pathlib import Path
    # import os
    # from ..app import SPARES_ENV, get_export_dir, find_usb_mount

    if SPARES_ENV == "dev":
        export_dir = get_export_dir(None)
        usb = None
    else:
        usb = find_usb_mount()
        export_dir = get_export_dir(usb)

    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT
                peo.ean,
                peo.part_number,
                p.name,
                p.unit,
                p.default_location,
                p.ean AS amos_ean,
                peo.source,
                peo.note,
                peo.created_at,
                peo.updated_at
            FROM part_ean_overrides peo
            JOIN parts p ON p.number = peo.part_number
            ORDER BY peo.created_at DESC;
            """
        ).fetchall()
        data = [dict(row) for row in rows]
        count = len(data)

    wb = Workbook()
    ws = wb.active
    ws.title = "EAN Overrides"

    headers = [
        "EAN Override",
        "Part Number",
        "Name",
        "Unit",
        "Default Location",
        "AMOS EAN",
        "Source",
        "Note",
        "Created At",
        "Updated At",
    ]

    ws.append(headers)

    for row in data:
        ws.append([
            row["ean"],
            row["part_number"],
            row["name"],
            row["unit"],
            row["default_location"],
            row["amos_ean"],
            row["source"],
            row["note"],
            row["created_at"],
            row["updated_at"],
        ])

    filename = f"roboard_ean_overrides_{datetime.now().strftime('%Y-%m-%d_%H-%M')}.xlsx"
    out_path = export_dir / filename
    wb.save(out_path)

    # Clear EAN overrides after successful export
    with get_conn() as conn:
        conn.execute("DELETE FROM part_ean_overrides;")
        conn.commit()

    return {
        "exported_file": str(out_path),
        "export_dir": str(export_dir),
        "usb_detected": bool(usb),
        "rows_exported": count,
    }
