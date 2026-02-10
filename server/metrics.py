import time
from collections import defaultdict
from datetime import datetime, timezone

from db import get_conn

# bucket seconds: 3600 = per hour. Use 60 if you want per-minute.
BUCKET_SECONDS = 3600

# in-memory counters to avoid constant SQLite writes
# key = (bucket_start_iso, method, route)
_counts = defaultdict(lambda: {"total": 0, "2xx": 0, "4xx": 0, "5xx": 0, "sum_ms": 0, "max_ms": 0})

_last_flush = 0.0
FLUSH_EVERY_SECONDS = 30


def _bucket_start_iso(ts: float) -> str:
    bucket = int(ts // BUCKET_SECONDS) * BUCKET_SECONDS
    dt = datetime.fromtimestamp(bucket, tz=timezone.utc)
    return dt.isoformat()


def record_request(method: str, route: str | None, status_code: int, duration_ms: int):
    global _last_flush

    route = route or "__unmatched__"
    now = time.time()
    bucket = _bucket_start_iso(now)
    key = (bucket, method, route)

    d = _counts[key]
    d["total"] += 1
    if 200 <= status_code < 300:
        d["2xx"] += 1
    elif 400 <= status_code < 500:
        d["4xx"] += 1
    elif status_code >= 500:
        d["5xx"] += 1

    d["sum_ms"] += int(duration_ms)
    d["max_ms"] = max(d["max_ms"], int(duration_ms))

    if now - _last_flush >= FLUSH_EVERY_SECONDS:
        flush()
        _last_flush = now


def init_metrics_table():
    conn = get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS api_usage (
              bucket_start TEXT NOT NULL,
              method TEXT NOT NULL,
              route TEXT NOT NULL,
              total INTEGER NOT NULL,
              count_2xx INTEGER NOT NULL,
              count_4xx INTEGER NOT NULL,
              count_5xx INTEGER NOT NULL,
              sum_duration_ms INTEGER NOT NULL,
              max_duration_ms INTEGER NOT NULL,
              PRIMARY KEY(bucket_start, method, route)
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


def flush():
    if not _counts:
        return

    conn = get_conn()
    try:
        for (bucket, method, route), d in list(_counts.items()):
            conn.execute(
                """
                INSERT INTO api_usage(
                  bucket_start, method, route,
                  total, count_2xx, count_4xx, count_5xx,
                  sum_duration_ms, max_duration_ms
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(bucket_start, method, route) DO UPDATE SET
                  total = total + excluded.total,
                  count_2xx = count_2xx + excluded.count_2xx,
                  count_4xx = count_4xx + excluded.count_4xx,
                  count_5xx = count_5xx + excluded.count_5xx,
                  sum_duration_ms = sum_duration_ms + excluded.sum_duration_ms,
                  max_duration_ms = MAX(max_duration_ms, excluded.max_duration_ms)
                """,
                (
                    bucket, method, route,
                    d["total"], d["2xx"], d["4xx"], d["5xx"],
                    d["sum_ms"], d["max_ms"],
                ),
            )
            del _counts[(bucket, method, route)]
        conn.commit()
    finally:
        conn.close()
