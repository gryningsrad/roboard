"""
Simple database migration script for adding ROB table.

Run manually:
    python db_migrate.py
"""

import sqlite3
from pathlib import Path

# Adjust path if needed
DB_PATH = Path("app.db")  # change if your DB lives elsewhere
import sqlite3
from pathlib import Path
from typing import Callable, List, Tuple

Migration = Tuple[str, Callable[[sqlite3.Connection], None]]

MIGRATIONS: List[Migration] = []

def migration(mid: str):
    """
    Decorator to register a migration function with a unique migration id.

    Migration IDs should be sortable in the order you want them applied:
    e.g. '001_init', '002_add_rob', '003_add_parts_ean'
    """
    def decorator(fn: Callable[[sqlite3.Connection], None]):
        MIGRATIONS.append((mid, fn))
        return fn
    return decorator


def ensure_migrations_table(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)


def applied_migrations(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT id FROM schema_migrations;").fetchall()
    return {r[0] for r in rows}


def mark_applied(conn: sqlite3.Connection, mid: str) -> None:
    conn.execute("INSERT INTO schema_migrations (id) VALUES (?);", (mid,))


def migrate(db_path: Path = DB_PATH) -> None:
    if not db_path.exists():
        print(f"Database not found at: {db_path.resolve()}")
        print("Aborting migration.")
        return

    print(f"Connecting to database: {db_path.resolve()}")

    # Ensure deterministic order
    migrations_sorted = sorted(MIGRATIONS, key=lambda x: x[0])

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        ensure_migrations_table(conn)

        already = applied_migrations(conn)

        ran_any = False
        for mid, fn in migrations_sorted:
            if mid in already:
                continue

            print(f"Applying migration: {mid} ...")
            try:
                conn.execute("BEGIN;")
                fn(conn)
                mark_applied(conn, mid)
                conn.commit()
                print(f"✓ Applied: {mid}")
                ran_any = True
            except Exception as e:
                conn.rollback()
                print(f"✗ Failed: {mid}\n  Error: {e}")
                raise

        if not ran_any:
            print("No migrations to apply. Schema is up to date.")

    finally:
        conn.close()


# -------------------------
# Migrations start here
# -------------------------
@migration("001_init")
def m001_init(conn: sqlite3.Connection) -> None:
    """
    Create base tables for a fresh install.

    IMPORTANT:
    - Do NOT drop tables here (migrations should be forward-only in production).
    - Use CREATE TABLE IF NOT EXISTS so it is safe if partially present.
    """
    conn.execute("""
        CREATE TABLE IF NOT EXISTS parts (
            number TEXT PRIMARY KEY,
            name TEXT,
            qa_grading TEXT,
            maker_code TEXT,
            makers_reference TEXT,
            unit TEXT,
            pref_vendor_code TEXT,
            order_status TEXT,
            default_location TEXT,
            stock_class TEXT,
            stock_class_description TEXT,
            reserved INTEGER,
            price_class TEXT,
            asset TEXT,
            hm TEXT,
            attachments TEXT,
            weight_unit TEXT,
            weight REAL,
            alternative_available TEXT,
            imported_at TEXT
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            number TEXT PRIMARY KEY,
            title TEXT,
            vendor TEXT,
            del_address TEXT,
            form_type TEXT,
            form_status TEXT,
            created TEXT,
            approved TEXT,
            ordered TEXT,
            confirmed TEXT,
            received TEXT,
            service_order TEXT,
            details TEXT,
            estimate_total REAL,
            created_by TEXT,
            approved_by TEXT,
            ordered_by TEXT,
            imported_at TEXT
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS wishlist (
        part_number TEXT PRIMARY KEY,
        toggled_at TEXT,
        FOREIGN KEY(part_number) REFERENCES parts(number) ON DELETE CASCADE
        );
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS rob (
        part_number TEXT PRIMARY KEY,
        rob REAL NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(part_number) REFERENCES parts(number) ON DELETE CASCADE
        );
    """)


@migration("002_add_rob")
def m002_add_rob(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS rob (
            part_number TEXT PRIMARY KEY,
            rob REAL NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(part_number)
                REFERENCES parts(number)
                ON DELETE CASCADE
        );
    """)


@migration("003_add_parts_ean")
def m003_add_parts_ean(conn: sqlite3.Connection) -> None:
    # SQLite can't do IF NOT EXISTS on ADD COLUMN, so we check pragma table_info.
    cols = conn.execute("PRAGMA table_info(parts);").fetchall()
    col_names = {c[1].lower() for c in cols}

    if "ean" in col_names:
        return

    conn.execute("ALTER TABLE parts ADD COLUMN ean TEXT;")
    # Optional: add an index for lookup speed
    conn.execute("CREATE INDEX IF NOT EXISTS idx_parts_ean ON parts(ean);")


if __name__ == "__main__":
    migrate()
