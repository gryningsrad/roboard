"""
Spares Kiosk API application.

Provides endpoints for:
- Importing parts and orders from Excel files
- Managing wishlist entries
- Managing ROB (Remaining On Board) values
- Exporting wishlist and ROB data to Excel

Designed to run on a Raspberry Pi kiosk environment with optional USB export.
"""

from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
# from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime, timezone

from db import init_db, get_conn
from import_excel import import_parts_replace_all, import_orders_replace_all
from export_rob import export_rob_xlsx
from export_locations import export_locations_xlsx

from usb import find_usb_mount
from export_wishlist import export_wishlist_xlsx
from config import SPARES_ENV, get_export_dir

# Logging and metrics
from logging_setup import setup_logging
from middleware import RequestContextLoggingMiddleware
from metrics import init_metrics_table, record_request, flush
import structlog

app = FastAPI(
    title="ROBoard Spares Kiosk API",
    version="1.0.0"
)

# Logging middleware is added before any routes to ensure all requests are logged, including unmatched routes.
logger = setup_logging()
app.add_middleware(RequestContextLoggingMiddleware)

BASE = Path(__file__).resolve().parent
class RobIn(BaseModel):
    """
    Payload model for setting or adjusting ROB (Remaining On Board).

    Attributes:
        rob (float):
            If positive, sets ROB to an absolute value.
            If negative, applies a delta (deduction) to the existing ROB value.
    """
    rob: float

class LocationOverrideIn(BaseModel):
    part_number: str
    new_location: str
    note: str | None = None

@app.on_event("startup")
def startup():
    """
    Initialize the application on startup.

    If the database file does not exist in the application directory,
    the database schema will be created by calling `init_db()`.
    """
    if not (BASE / "app.db").exists():
        init_db()
    
    # Logging and metrics setup
    init_metrics_table()
    logger.info("startup_complete", env=SPARES_ENV, db=str(BASE / "app.db"))

@app.on_event("shutdown")
def shutdown():
    flush()
    logger.info("shutdown_complete")

@app.post("/api/import/parts")
async def import_parts(file: UploadFile = File(...)):
    """
    Replace all parts in the database with data from an uploaded Excel file.

    The uploaded file must be an .xlsx file. The file is temporarily written
    to disk, processed by `import_parts_replace_all`, and then removed.

    Args:
        file (UploadFile):
            Excel file containing parts data.

    Returns:
        dict:
            Result returned from `import_parts_replace_all`.

    Raises:
        HTTPException(400):
            If the uploaded file is not an .xlsx file.
    """
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(400, "Upload an .xlsx file")
    tmp = BASE / "_parts.xlsx"
    tmp.write_bytes(await file.read())
    try:
        return import_parts_replace_all(tmp)
    finally:
        tmp.unlink(missing_ok=True)


@app.post("/api/import/orders")
async def import_orders(file: UploadFile = File(...)):
    """
    Replace all orders in the database with data from an uploaded Excel file.

    The uploaded file must be an .xlsx file. The file is temporarily written
    to disk, processed by `import_orders_replace_all`, and then removed.

    Args:
        file (UploadFile):
            Excel file containing orders data.

    Returns:
        dict:
            Result returned from `import_orders_replace_all`.

    Raises:
        HTTPException(400):
            If the uploaded file is not an .xlsx file.
    """
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(400, "Upload an .xlsx file")
    tmp = BASE / "_orders.xlsx"
    tmp.write_bytes(await file.read())
    try:
        return import_orders_replace_all(tmp)
    finally:
        tmp.unlink(missing_ok=True)


@app.get("/api/parts")
def search_parts(q: str = "", field: str = "all", limit: int = 50):
    """
    Search parts in the database.

    If no query is provided, returns a limited list of all parts.
    If a query is provided, performs a tokenized LIKE-based search (order independent)
    on the selected field.

    Args:
        q (str):
            Search query string.
        field (str):
            Field to search in. One of:
                - "name"
                - "makers_ref"
                - "location"
                - "ean"
                - "all" (default)
        limit (int):
            Maximum number of results to return.

    Returns:
        list[dict]:
            List of parts including wishlist status, ROB, and location override info.
    """
    q = (q or "").strip()
    field = (field or "all").lower()

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 50
    limit = max(1, min(limit, 200))

    tokens = [t for t in q.split() if t]
    print("TOKENS:", tokens, "FIELD:", field)

    conn = get_conn()
    try:
        if not tokens:
            rows = conn.execute(
                """
                SELECT p.*,
                    EXISTS(SELECT 1 FROM wishlist w WHERE w.part_number = p.number) AS wishlisted,
                    r.rob AS rob,
                    r.updated_at AS rob_updated_at,
                    lo.new_location AS overridden_location,
                    lo.updated_at AS location_updated_at
                FROM parts p
                LEFT JOIN rob r ON r.part_number = p.number
                LEFT JOIN location_overrides lo ON lo.part_number = p.number
                ORDER BY COALESCE(lo.new_location, p.default_location), p.number
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [dict(r) for r in rows]

        params = []

        def like_for(token: str) -> str:
            return f"%{token}%"

        if field == "name":
            where_parts = []
            for t in tokens:
                where_parts.append("p.name LIKE ?")
                params.append(like_for(t))
            where = " AND ".join(where_parts)

        elif field == "makers_ref":
            where_parts = []
            for t in tokens:
                where_parts.append("p.makers_reference LIKE ?")
                params.append(like_for(t))
            where = " AND ".join(where_parts)

        elif field == "location":
            # Search both original location and overridden location
            where_parts = []
            for t in tokens:
                where_parts.append("(p.default_location LIKE ? OR lo.new_location LIKE ?)")
                like = like_for(t)
                params.extend([like, like])
            where = " AND ".join(where_parts)

        elif field == "ean":
            where_parts = []
            for t in tokens:
                where_parts.append("p.ean LIKE ?")
                params.append(like_for(t))
            where = " AND ".join(where_parts)

        else:
            # field == "all"
            token_groups = []
            for t in tokens:
                like = like_for(t)

                if t.isdigit() and len(t) >= 5:
                    token_groups.append(
                        "("
                        "p.number LIKE ? OR "
                        "REPLACE(p.number, '.', '') LIKE ? OR "
                        "p.name LIKE ? OR "
                        "p.makers_reference LIKE ? OR "
                        "p.default_location LIKE ? OR "
                        "lo.new_location LIKE ? OR "
                        "p.ean LIKE ?"
                        ")"
                    )
                    params.extend([like, like, like, like, like, like, like])
                else:
                    token_groups.append(
                        "("
                        "p.number LIKE ? OR "
                        "p.name LIKE ? OR "
                        "p.makers_reference LIKE ? OR "
                        "p.default_location LIKE ? OR "
                        "lo.new_location LIKE ? OR "
                        "p.ean LIKE ?"
                        ")"
                    )
                    params.extend([like, like, like, like, like, like])

            where = " AND ".join(token_groups)

        rows = conn.execute(
            f"""
            SELECT p.*,
                EXISTS(SELECT 1 FROM wishlist w WHERE w.part_number = p.number) AS wishlisted,
                r.rob AS rob,
                r.updated_at AS rob_updated_at,
                lo.new_location AS overridden_location,
                lo.updated_at AS location_updated_at
            FROM parts p
            LEFT JOIN rob r ON r.part_number = p.number
            LEFT JOIN location_overrides lo ON lo.part_number = p.number
            WHERE {where}
            ORDER BY COALESCE(lo.new_location, p.default_location), p.number
            LIMIT ?
            """,
            (*params, limit),
        ).fetchall()

        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.get("/api/simple_parts")
def simple_search_parts(q: str = "", field: str = "all", limit: int = 50):
    """
    Search parts in the database.

    If no query is provided, returns a limited list of all parts.
    If a query is provided, performs a LIKE-based search on the selected field.

    Args:
        q (str):
            Search query string.
        field (str):
            Field to search in. One of:
                - "name"
                - "makers_ref"
                - "location"
                - "all" (default)
        limit (int):
            Maximum number of results to return.

    Returns:
        list[dict]:
            List of parts including wishlist status and ROB information.
    """
    q = (q or "").strip()
    field = (field or "all").lower()

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 50

    limit = max(1, min(limit, 200))

    conn = get_conn()
    try:
        if not q:
            rows = conn.execute(
                """
                SELECT p.*,
                    EXISTS(SELECT 1 FROM wishlist w WHERE w.part_number = p.number) AS wishlisted,
                    r.rob AS rob,
                    r.updated_at AS rob_updated_at
                FROM parts p
                LEFT JOIN rob r ON r.part_number = p.number
                ORDER BY p.default_location, p.number
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        else:
            like = f"%{q}%"

            if field == "name":
                where = "p.name LIKE ?"
                params = (like,)
            elif field == "makers_ref":
                where = "p.makers_reference LIKE ?"
                params = (like,)
            elif field == "location":
                where = "p.default_location LIKE ?"
                params = (like,)
            elif field == "ean":
                where = "p.ean LIKE ?"
                params = (like,)
            else:
                where = """
                    p.number LIKE ?
                    OR p.name LIKE ?
                    OR p.makers_reference LIKE ?
                    OR p.default_location LIKE ?
                    OR p.ean LIKE ?
                """
                params = (like, like, like, like, like)

            rows = conn.execute(
                f"""
                SELECT p.*,
                    EXISTS(SELECT 1 FROM wishlist w WHERE w.part_number = p.number) AS wishlisted,
                    r.rob AS rob,
                    r.updated_at AS rob_updated_at
                FROM parts p
                LEFT JOIN rob r ON r.part_number = p.number
                WHERE {where}
                ORDER BY p.default_location, p.number
                LIMIT ?
                """,
                (*params, limit),
            ).fetchall()

        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.get("/api/wishlist")
def get_wishlist():
    """
    Retrieve all parts currently in the wishlist.

    Returns:
        list[dict]:
            List of wishlisted parts including full part metadata.
    """
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT p.*,
                1 AS wishlisted
            FROM wishlist w
            JOIN parts p ON p.number = w.part_number
            ORDER BY p.default_location, p.number
            """
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.post("/api/wishlist/export")
def export_and_clear_wishlist():
    """
    Export wishlist items to Excel and clear the wishlist.

    In development mode, exports to a local directory.
    In production mode, attempts to export to a detected USB mount.

    After successful export, all wishlist entries are deleted.

    Returns:
        dict:
            Metadata about the export operation including:
                - exported file path
                - export directory
                - USB detection status
                - number of rows exported
                - confirmation that wishlist was cleared
    """
    if SPARES_ENV == "dev":
        export_dir = get_export_dir(None)
        usb = None
    else:
        usb = find_usb_mount()
        export_dir = get_export_dir(usb)

    conn = get_conn()
    try:
        count = conn.execute("SELECT COUNT(*) AS c FROM wishlist").fetchone()["c"]
    finally:
        conn.close()

    out_path = export_wishlist_xlsx(export_dir)

    conn = get_conn()
    try:
        conn.execute("DELETE FROM wishlist;")
        conn.commit()
    finally:
        conn.close()

    return {
        "exported_file": str(out_path),
        "export_dir": str(export_dir),
        "usb_detected": bool(usb),
        "rows_exported": int(count or 0),
        "wishlist_cleared": True,
    }


@app.post("/api/wishlist/toggle/{part_number}")
def toggle_wishlist(part_number: str):
    """
    Toggle wishlist status for a given part.

    If the part is already wishlisted, it will be removed.
    If not, it will be added to the wishlist.

    Args:
        part_number (str):
            Unique identifier of the part.

    Returns:
        dict:
            Part number and updated wishlist status.

    Raises:
        HTTPException(404):
            If the part does not exist.
    """
    conn = get_conn()
    try:
        p = conn.execute("SELECT number FROM parts WHERE number = ?", (part_number,)).fetchone()
        if not p:
            raise HTTPException(404, "Part not found")

        w = conn.execute("SELECT part_number FROM wishlist WHERE part_number = ?", (part_number,)).fetchone()
        if w:
            conn.execute("DELETE FROM wishlist WHERE part_number = ?", (part_number,))
            conn.commit()
            return {"part_number": part_number, "wishlisted": False}
        else:
            conn.execute(
                "INSERT INTO wishlist(part_number, toggled_at) VALUES(?, datetime('now'))",
                (part_number,),
            )
            conn.commit()
            return {"part_number": part_number, "wishlisted": True}
    finally:
        conn.close()


@app.get("/api/rob")
def get_rob_list():
    """
    Retrieve all current ROB entries.

    Returns:
        list[dict]:
            List of parts with associated ROB values and last update timestamps.
    """
    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT p.number, p.name, p.makers_reference, p.default_location,
                r.rob, r.updated_at
            FROM rob r
            JOIN parts p ON p.number = r.part_number
            ORDER BY p.default_location, p.number
            """
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.post("/api/rob/export")
def export_and_clear_rob():
    """
    Export ROB entries to Excel and clear all ROB records.

    In development mode, exports locally.
    In production mode, attempts export to a detected USB device.

    After successful export, all ROB entries are deleted.

    Returns:
        dict:
            Metadata about the export operation including:
                - exported file path
                - export directory
                - USB detection status
                - number of rows exported
                - confirmation that ROB was cleared
    """
    if SPARES_ENV == "dev":
        export_dir = get_export_dir(None)
        usb = None
    else:
        usb = find_usb_mount()
        export_dir = get_export_dir(usb)

    conn = get_conn()
    try:
        count = conn.execute("SELECT COUNT(*) AS c FROM rob").fetchone()["c"]
    finally:
        conn.close()

    out_path = export_rob_xlsx(export_dir)

    conn = get_conn()
    try:
        conn.execute("DELETE FROM rob;")
        conn.commit()
    finally:
        conn.close()

    return {
        "exported_file": str(out_path),
        "export_dir": str(export_dir),
        "usb_detected": bool(usb),
        "rows_exported": int(count or 0),
        "rob_cleared": True,
    }


@app.post("/api/rob/{part_number}")
def set_rob(part_number: str, payload: RobIn):
    """
    Set or adjust ROB for a specific part.

    If `payload.rob` is positive:
        The ROB value is set absolutely.

    If `payload.rob` is negative:
        The value is treated as a delta and deducted from the existing ROB.

    The final ROB value is never allowed to drop below zero.

    Args:
        part_number (str):
            Unique identifier of the part.
        payload (RobIn):
            Contains the ROB value (absolute or delta).

    Returns:
        dict:
            Updated ROB record for the part.

    Raises:
        HTTPException(404):
            If the part does not exist.
    """
    conn = get_conn()
    try:
        p = conn.execute("SELECT number FROM parts WHERE number = ?", (part_number,)).fetchone()
        if not p:
            raise HTTPException(404, "Part not found")

        val = float(payload.rob)

        if val < 0:
            old_row = conn.execute(
                "SELECT rob FROM rob WHERE part_number = ?",
                (part_number,),
            ).fetchone()
            old = float(old_row["rob"]) if old_row else 0.0
            new_val = old + val
        else:
            new_val = val

        new_val = max(0.0, new_val)

        conn.execute(
            """
            INSERT INTO rob(part_number, rob, updated_at)
            VALUES(?, ?, datetime('now'))
            ON CONFLICT(part_number) DO UPDATE SET
            rob = excluded.rob,
            updated_at = datetime('now')
            """,
            (part_number, new_val),
        )
        conn.commit()

        row = conn.execute(
            "SELECT part_number, rob, updated_at FROM rob WHERE part_number = ?",
            (part_number,),
        ).fetchone()

        return dict(row)
    finally:
        conn.close()

@app.get("/api/locations")
def list_location_overrides(q: str = "", limit: int = 200):
    q = (q or "").strip()
    limit = max(1, min(int(limit or 200), 500))

    conn = get_conn()
    try:
        if q:
            rows = conn.execute(
                """
                SELECT lo.part_number, p.name, p.default_location AS old_location,
                    lo.new_location, lo.note, lo.updated_at
                FROM location_overrides lo
                JOIN parts p ON p.number = lo.part_number
                WHERE lo.part_number LIKE ? OR p.name LIKE ? OR lo.new_location LIKE ?
                ORDER BY lo.updated_at DESC
                LIMIT ?
                """,
                (f"%{q}%", f"%{q}%", f"%{q}%", limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT lo.part_number, p.name, p.default_location AS old_location,
                    lo.new_location, lo.note, lo.updated_at
                FROM location_overrides lo
                JOIN parts p ON p.number = lo.part_number
                ORDER BY lo.updated_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.post("/api/locations/set")
def set_location_override(payload: LocationOverrideIn):
    part_number = (payload.part_number or "").strip()
    new_location = (payload.new_location or "").strip()
    note = (payload.note or "").strip() or None

    if not part_number:
        raise HTTPException(status_code=400, detail="part_number is required")
    if not new_location:
        raise HTTPException(status_code=400, detail="new_location is required")

    now = datetime.now(timezone.utc).isoformat()

    conn = get_conn()
    try:
        # Ensure part exists (optional but sensible)
        exists = conn.execute(
            "SELECT 1 FROM parts WHERE number = ? LIMIT 1",
            (part_number,),
        ).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="Part not found")

        conn.execute(
            """
            INSERT INTO location_overrides (part_number, new_location, note, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(part_number) DO UPDATE SET
                new_location=excluded.new_location,
                note=excluded.note,
                updated_at=excluded.updated_at
            """,
            (part_number, new_location, note, now),
        )
        conn.commit()
        return {"ok": True, "part_number": part_number, "new_location": new_location, "updated_at": now}
    finally:
        conn.close()

@app.post("/api/locations/export")
def export_location_overrides():
    if SPARES_ENV == "dev":
        export_dir = get_export_dir(None)
        usb = None
    else:
        usb = find_usb_mount()
        export_dir = get_export_dir(usb)

    conn = get_conn()
    try:
        rows = conn.execute(
            """
            SELECT lo.part_number, p.name, p.default_location AS old_location,
                lo.new_location, lo.note, lo.updated_at
            FROM location_overrides lo
            JOIN parts p ON p.number = lo.part_number
            ORDER BY lo.updated_at DESC
            """
        ).fetchall()
        data = [dict(r) for r in rows]
    finally:
        conn.close()

    # Write xlsx
    out_path = export_locations_xlsx(data, export_dir)  # we add this helper
    return {"ok": True, "count": len(data), "file": str(out_path), "usb": (usb is not None)}
