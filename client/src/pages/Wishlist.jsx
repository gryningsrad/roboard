import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api.js";
import PartCard from "../components/PartCard.jsx";

export default function Wishlist() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const data = await apiGet("/api/wishlist");
      setRows(data.map((p) => ({ ...p, wishlisted: 1 })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleWishlist(partNumber) {
    const res = await apiPost(`/api/wishlist/toggle/${encodeURIComponent(partNumber)}`);
    if (!res.wishlisted) setRows((prev) => prev.filter((p) => p.number !== partNumber));
  }

  function requestExport() {
    if (rows.length === 0) {
      setMsg("Wishlist is empty — nothing to export.");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmExport() {
    setConfirmOpen(false);
    setExporting(true);
    setMsg("");
    try {
      const res = await apiPost("/api/wishlist/export");
      setRows([]);
      setMsg(
        `Exported ${res.rows_exported} item(s) to: ${res.exported_file} (USB: ${
          res.usb_detected ? "Yes" : "No"
        })`
      );
    } catch (e) {
      setMsg(e?.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--rb-text)]">
            Wishlist
          </h1>
          <p className="text-sm text-[var(--rb-muted)]">
            Parts you have marked for ordering later.
          </p>
        </div>
        <button
          onClick={load}
          className="px-5 py-3 rounded-2xl bg-[var(--rb-base)] border border-[var(--rb-border)] text-sm font-semibold text-[var(--rb-text)] hover:bg-[var(--rb-surface)]/70 transition"
        >
          Refresh
        </button>
      </div>

      {msg ? (
        <div className="text-sm text-[var(--rb-text)] border border-[var(--rb-border)] rounded-2xl p-3 bg-[var(--rb-surface)]/20 break-all">
          {msg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        {/* List = ~80% */}
        <div className="lg:col-span-4 space-y-3">
          {loading ? (
            <div className="text-sm text-[var(--rb-muted)]">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-[var(--rb-muted)] border border-[var(--rb-border)] rounded-2xl p-4 bg-[var(--rb-surface)]/20">
              Wishlist is empty.
            </div>
          ) : (
            rows.map((p) => (
              <PartCard key={p.number} part={p} onToggleWishlist={toggleWishlist} />
            ))
          )}
        </div>

        {/* Export panel = ~20% */}
        <aside className="lg:col-span-1 border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4 sticky top-24">
          <h2 className="text-sm font-semibold text-[var(--rb-text)]">Actions</h2>
          <p className="mt-1 text-xs text-[var(--rb-muted)]">
            Exports the current wishlist to an Excel file (USB if detected), then clears the wishlist.
          </p>

          <button
            onClick={requestExport}
            disabled={exporting || rows.length === 0}
            className={[
              "mt-4 w-full px-4 py-4 rounded-2xl text-base font-extrabold border transition",
              exporting || rows.length === 0
                ? "bg-[var(--rb-surface)]/10 border-[var(--rb-border)] text-white/35 cursor-not-allowed"
                : "bg-[var(--rb-base)] border-[var(--rb-accent)]/45 text-[var(--rb-text)] hover:bg-[var(--rb-base)]/85 ring-1 ring-[var(--rb-accent)]/35",
            ].join(" ")}
          >
            {exporting ? "Exporting…" : "Export wishlist"}
          </button>

          <div className="mt-3 text-xs text-[var(--rb-dim)]">
            Items: <span className="font-mono text-[var(--rb-text)]">{rows.length}</span>
          </div>

          <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[var(--rb-dim)]">
            Procedure
          </div>
          <div className="mt-1 text-xs text-[var(--rb-muted)]">
            Export → Verify file → Place order → Clear complete.
          </div>
        </aside>
      </div>

      {/* Confirm modal */}
      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-bg)] p-5 shadow-xl">
            <h3 className="text-lg font-extrabold tracking-tight text-[var(--rb-text)]">
              Export wishlist?
            </h3>
            <p className="mt-2 text-sm text-[var(--rb-muted)]">
              This will export{" "}
              <span className="font-mono text-[var(--rb-text)]">{rows.length}</span>{" "}
              item(s) to an Excel file and then{" "}
              <span className="font-semibold text-[var(--rb-text)]">clear the wishlist</span>.
            </p>

            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--rb-surface)]/20 hover:bg-[var(--rb-surface)]/35 border border-[var(--rb-border)] text-sm font-semibold text-[var(--rb-muted)] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmExport}
                className="px-4 py-2 rounded-xl bg-[var(--rb-base)] hover:bg-[var(--rb-base)]/85 border border-[var(--rb-accent)]/50 text-[var(--rb-text)] text-sm font-extrabold transition ring-1 ring-[var(--rb-accent)]/35"
              >
                Export &amp; clear
              </button>
            </div>

            <div className="mt-3 text-xs text-[var(--rb-dim)]">
              Tip: Export when you are ready to place the order. This clears the wishlist locally.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
