from datetime import datetime
from pathlib import Path
from openpyxl import Workbook
from db import get_conn

def export_rob_xlsx(dest: Path) -> Path:
    """
    Export current ROB (Remaining On Board) data to an Excel (.xlsx) file.

    The function queries the database for all parts that have ROB entries,
    joins them with part metadata, and writes the result to a newly created
    Excel workbook. The file is saved in the provided destination directory
    with a timestamped filename.

    The resulting Excel file contains the following columns:
        - Number
        - Name
        - Maker's Reference
        - Default Location
        - ROB
        - Updated At

    The output file name format:
        rob_YYYYMMDD_HHMM.xlsx

    Args:
        dest (Path):
            Destination directory where the Excel file should be saved.
            The directory will be created if it does not already exist.

    Returns:
        Path:
            The full path to the generated Excel file.

    Raises:
        Any exception raised by the database connection, query execution,
        or file system operations will propagate to the caller.
    """
    dest.mkdir(parents=True, exist_ok=True)
    out = dest / f"rob_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"

    conn = get_conn()
    try:
        rows = conn.execute("""
            SELECT p.number, p.name, p.makers_reference, p.default_location,
                r.rob, r.updated_at
            FROM rob r
            JOIN parts p ON p.number = r.part_number
            ORDER BY p.default_location, p.number
        """).fetchall()
    finally:
        conn.close()

    wb = Workbook()
    ws = wb.active
    ws.title = "ROB"
    ws.append(["Number", "Name", "Maker's Reference", "Default Location", "ROB", "Updated At"])

    for r in rows:
        ws.append([
            r["number"],
            r["name"],
            r["makers_reference"],
            r["default_location"],
            r["rob"],
            r["updated_at"]
        ])

    wb.save(out)
    return out
