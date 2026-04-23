import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api.js";
import PartCard from "../components/PartCard.jsx";

export default function LocationsPage({ pushToast, refreshNavCounts }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [busyExport, setBusyExport] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [robFlashKey, setRobFlashKey] = useState(null);

  function triggerRobFlash(partNumber) {
    setRobFlashKey(partNumber);
    setTimeout(() => {
      setRobFlashKey((k) => (k === partNumber ? null : k));
    }, 450);
  }

  function onRobUpdated(partNumber, newRob, updatedAt) {
    setRows((prev) =>
      prev.map((p) =>
        p.number === partNumber ? { ...p, rob: newRob, rob_updated_at: updatedAt } : p
      )
    );
    triggerRobFlash(partNumber);
    pushToast?.("success", `ROB saved for ${partNumber}`);
  }

  function onLocationUpdated(partNumber, newLocation, updatedAt, note) {
    setRows((prev) =>
      prev.map((p) =>
        p.number === partNumber
          ? {
              ...p,
              overridden_location: newLocation,
              location_updated_at: updatedAt,
              location_note: note,
            }
          : p
      )
    );
  }

  async function refresh() {
    setBusy(true);
    setMsg("");
    try {
      const data = await apiGet("/api/locations?limit=300");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const m = e?.message || "Failed to load locations.";
      setMsg(m);
      pushToast?.("error", m);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = useMemo(() => rows.length, [rows]);

  // user clicked export button, show confirmation if there are rows
  function requestExport() {
    if (rows.length === 0) {
      setMsg("No location overrides available to export.");
      return;
    }
    setConfirmOpen(true);
  }

  // confirmed by user, call API
  async function confirmExport() {
    setConfirmOpen(false);
    setBusyExport(true);
    setMsg("");
    try {
      const r = await apiPost("/api/locations/export", {});
      await refresh(); // clear rows on success
      refreshNavCounts?.();
      setMsg(`Exported ${r?.rows_exported ?? 0} row(s) and cleared the location override list.`);
      pushToast?.("success", `Location overrides exported (${r?.rows_exported ?? 0}) and cleared`);
    } catch (e) {
      const m = e?.message || "Export failed.";
      setMsg(m);
      pushToast?.("error", m);
    } finally {
      setBusyExport(false);
    }
  }

  async function toggleWishlist(partNumber) {
    try {
      const res = await apiPost(`/api/wishlist/toggle/${encodeURIComponent(partNumber)}`);
      setRows((prev) =>
        prev.map((p) =>
          p.number === partNumber ? { ...p, wishlisted: res.wishlisted ? 1 : 0 } : p
        )
      );
      refreshNavCounts?.();
    } catch (e) {
      const m = e?.message || "Failed to update wishlist.";
      setMsg(m);
      pushToast?.("error", m);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--rb-text)]">
            Location Overrides
          </h1>
          <p className="text-sm text-[var(--rb-muted)]">
            {count} active override{count !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={busy}
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
        <div className="lg:col-span-4 space-y-3">
          {busy ? (
            <div className="text-sm text-[var(--rb-muted)]">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-[var(--rb-muted)] border border-[var(--rb-border)] rounded-2xl p-4 bg-[var(--rb-surface)]/20">
              No location overrides have been set.
            </div>
          ) : (
            rows.map((p) => (
              <PartCard
                key={p.number}
                part={p}
                onToggleWishlist={toggleWishlist}
                onRobUpdated={onRobUpdated}
                onLocationUpdated={onLocationUpdated}
                refreshNavCounts={refreshNavCounts}
                robFlash={robFlashKey === p.number}
                pushToast={pushToast}
              />
            ))
          )}
        </div>

        {/* Actions sidebar */}
        <aside className="lg:col-span-1 border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4 sticky top-24">
          <h2 className="text-sm font-semibold text-[var(--rb-text)]">Actions</h2>
          <p className="mt-1 text-xs text-[var(--rb-muted)]">
            Export the current location override list to an Excel file and clear the
            list.
          </p>

          <button
            onClick={requestExport}
            disabled={busyExport || rows.length === 0}
            className={[
              "mt-4 w-full px-4 py-4 rounded-2xl text-base font-extrabold border transition",
              busyExport || rows.length === 0
                ? "bg-[var(--rb-surface)]/10 border-[var(--rb-border)] text-white/35 cursor-not-allowed"
                : "bg-[var(--rb-base)] border-[var(--rb-accent)]/45 text-[var(--rb-text)] hover:bg-[var(--rb-base)]/85 ring-1 ring-[var(--rb-accent)]/35",
            ].join(" ")}
          >
            {busyExport ? "Exporting…" : "Export XLSX"}
          </button>

          <div className="mt-3 text-xs text-[var(--rb-dim)]">
            Items: <span className="font-mono text-[var(--rb-text)]">{rows.length}</span>
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
              Export location overrides?
            </h3>
            <p className="mt-2 text-sm text-[var(--rb-muted)]">
              This will export{" "}
              <span className="font-mono text-[var(--rb-text)]">{rows.length}</span>{" "}
              override{rows.length !== 1 ? "s" : ""} to an Excel file and then{" "}
              <span className="font-semibold text-[var(--rb-text)]">clear the list</span>.
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
              Tip: make sure you're ready to clear the overrides when exporting.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
