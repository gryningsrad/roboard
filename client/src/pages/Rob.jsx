import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api.js";

export default function Rob({ pushToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const data = await apiGet("/api/rob");
      setRows(data);
    } catch (e) {
      const m = e?.message || "Failed to load ROB list.";
      setMsg(m);
      pushToast?.("error", m);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function requestExport() {
    if (rows.length === 0) {
      setMsg("ROB list is empty — nothing to export.");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmExport() {
    setConfirmOpen(false);
    setExporting(true);
    setMsg("");
    try {
      const res = await apiPost("/api/rob/export");
      setRows([]);
      const m = `Exported ${res.rows_exported} item(s) to: ${res.exported_file} (USB: ${
        res.usb_detected ? "Yes" : "No"
      })`;
      setMsg(m);
      pushToast?.("success", `ROB exported (${res.rows_exported}) and cleared`);
    } catch (e) {
      const m = e?.message || "Export failed.";
      setMsg(m);
      pushToast?.("error", m);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--rb-text)]">
            <span className="text-[var(--rb-accent)]">ROB</span>
          </h1>
          <p className="text-sm text-[var(--rb-muted)]">
            Parts with Remaining On Board set. Export to Excel and clear when updating PMS.
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
              No ROB values set.
            </div>
          ) : (
            <div className="border border-[var(--rb-border)] rounded-2xl overflow-hidden bg-[var(--rb-surface)]/10">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-[0.14em] text-[var(--rb-dim)] bg-[var(--rb-surface)]/20">
                <div className="col-span-2">Number</div>
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-1">
                  <span className="text-[var(--rb-accent)] font-extrabold">ROB</span>
                </div>
                <div className="col-span-2">Updated</div>
              </div>

              {rows.map((r) => (
                <div
                  key={r.number}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-t border-[var(--rb-border)]"
                >
                  <div className="col-span-2 font-semibold text-[var(--rb-text)]">
                    <span className="font-mono">{r.number}</span>
                  </div>
                  <div className="col-span-5 text-[var(--rb-muted)] truncate">{r.name}</div>
                  <div className="col-span-2 text-[var(--rb-muted)] truncate">
                    {r.default_location || "—"}
                  </div>
                  <div className="col-span-1 text-[var(--rb-text)] font-semibold">
                    {r.rob}
                  </div>
                  <div className="col-span-2 text-[var(--rb-dim)] truncate">{r.updated_at}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export panel = ~20% */}
        <aside className="lg:col-span-1 border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4 sticky top-24">
          <h2 className="text-sm font-semibold text-[var(--rb-text)]">Actions</h2>
          <p className="mt-1 text-xs text-[var(--rb-muted)]">
            Exports the current ROB list to an Excel file (USB if detected), then clears the ROB list.
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
            {exporting ? "Exporting…" : "Export ROB"}
          </button>

          <div className="mt-3 text-xs text-[var(--rb-dim)]">
            Items: <span className="font-mono text-[var(--rb-text)]">{rows.length}</span>
          </div>

          <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[var(--rb-dim)]">
            Procedure
          </div>
          <div className="mt-1 text-xs text-[var(--rb-muted)]">
            Export → Verify file → Update PMS → Clear complete.
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
              Export <span className="text-[var(--rb-accent)]">ROB</span>?
            </h3>
            <p className="mt-2 text-sm text-[var(--rb-muted)]">
              This will export <span className="font-mono text-[var(--rb-text)]">{rows.length}</span>{" "}
              item(s) to an Excel file and then{" "}
              <span className="font-semibold text-[var(--rb-text)]">clear the ROB list</span>.
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
              Tip: Only export when you are ready to update PMS. This clears ROB locally.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
