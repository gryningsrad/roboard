import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api.js";

export default function LocationsPage({ pushToast }) {

  // convert ISO-like timestamp to 'yyyy-mm-dd hh:mm' local time
  function formatDateTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (isNaN(d)) return ts; // fall back if parse failed
    const pad = (n) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [busyExport, setBusyExport] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      const qs = new URLSearchParams();
      if ((q || "").trim()) qs.set("q", q.trim());
      qs.set("limit", "300");

      const data = await apiGet(`/api/locations?${qs.toString()}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      pushToast?.({
        type: "error",
        title: "Failed to load locations",
        message: String(e?.message || e),
      });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = useMemo(() => rows.length, [rows]);

  async function onExport() {
    setBusyExport(true);
    try {
      const r = await apiPost("/api/locations/export", {});
      // refresh from server to reflect any changes (and clear rows on success)
      await refresh();
      pushToast?.({
        type: "success",
        title: "Export completed",
        message: `Exported ${r?.rows_exported ?? 0} rows and cleared`,
      });
    } catch (e) {
      pushToast?.({
        type: "error",
        title: "Export failed",
        message: String(e?.message || e),
      });
    } finally {
      setBusyExport(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") refresh();
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
          onClick={onExport}
          disabled={busyExport}
          className="
            rounded-xl px-4 py-2 text-sm
            bg-[var(--rb-accent)]/15
            border border-[var(--rb-accent)]/30
            hover:bg-[var(--rb-accent)]/25
            disabled:opacity-60
            transition
          "
        >
          {busyExport ? "Exporting..." : "Export XLSX"}
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search part number, name or new location..."
          className="
            flex-1 px-4 py-2 text-sm
            rounded-xl
            bg-[var(--rb-surface)]/35
            border border-[var(--rb-border)]
            text-[var(--rb-text)]
            outline-none
            focus:ring-2 focus:ring-[var(--rb-accent)]/35
          "
        />

        <button
          onClick={refresh}
          disabled={busy}
          className="
            rounded-xl px-4 py-2 text-sm
            border border-[var(--rb-border)]
            hover:bg-[var(--rb-surface)]/35
            disabled:opacity-60
            transition
          "
        >
          {busy ? "Loading..." : "Search"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--rb-border)]">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-[var(--rb-surface)]/35 text-[var(--rb-muted)]">
              <tr>
                <th className="text-left font-medium px-4 py-3">Part</th>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Old Location</th>
                <th className="text-left font-medium px-4 py-3">New Location</th>
                <th className="text-left font-medium px-4 py-3">Note</th>
                <th className="text-left font-medium px-4 py-3">Updated</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.part_number}
                  className="border-t border-[var(--rb-border)]"
                >
                  <td className="px-4 py-3 font-mono">{r.part_number}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-[var(--rb-muted)]">
                    {r.old_location || "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--rb-text)]">
                    {r.new_location || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--rb-muted)]">
                    {r.note || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--rb-muted)]">
                    {formatDateTime(r.updated_at)}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[var(--rb-muted)]"
                  >
                    No location overrides have been set.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
