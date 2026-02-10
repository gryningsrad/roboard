import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "app.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db() -> None:
    conn = get_conn()
    try:
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        conn.commit()
    finally:
        conn.close()
