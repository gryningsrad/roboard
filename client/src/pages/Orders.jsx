import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api.js";

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet("/api/orders?limit=200");
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((o) =>
      (o.number || "").toLowerCase().includes(s) ||
      (o.title || "").toLowerCase().includes(s) ||
      (o.vendor || "").toLowerCase().includes(s) ||
      (o.form_status || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="text-sm text-slate-400">Header list only (line items not available yet).</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by number, title, vendor, status…"
        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-slate-600"
      />

      <div className="border border-slate-800 rounded-2xl overflow-hidden">
        <div className="bg-slate-900/40 border-b border-slate-800 px-4 py-3 text-sm text-slate-200 flex justify-between">
          <span>{loading ? "Loading…" : `${filtered.length} orders`}</span>
          <span className="text-slate-400 hidden sm:inline">Newest first</span>
        </div>

        <div className="divide-y divide-slate-800">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">No orders.</div>
          ) : (
            filtered.map((o) => (
              <div key={o.number} className="p-4 bg-slate-950/20 hover:bg-slate-900/20 transition">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-300 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">
                        {o.number}
                      </span>
                      {o.form_status ? <span className="text-xs text-slate-400">{o.form_status}</span> : null}
                    </div>
                    <div className="mt-2 text-base font-semibold leading-snug">
                      {o.title || <span className="text-slate-500 italic">No title</span>}
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      {o.vendor || <span className="text-slate-500 italic">No vendor</span>}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 sm:text-right">
                    <div>Created: {o.created || "—"}</div>
                    <div>Ordered: {o.ordered || "—"}</div>
                    <div>Received: {o.received || "—"}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
