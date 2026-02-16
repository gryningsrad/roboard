import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "../api.js";
import PartCard from "../components/PartCard.jsx";

export default function Parts({ pushToast }) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchField, setSearchField] = useState("all");

  // Stock Class filter: all | engine(E) | electric(EL)
  const [stockClass, setStockClass] = useState("all");

  const scanRef = useRef(null);
  const debouncedQ = useDebounced(q, 200);
  const searchRef = useRef(null);
  const lastEscRef = useRef(0);

  const placeholderMap = {
    all: "Search part number, name, maker ref, location, EAN…",
    name: "Search by name…",
    makers_ref: "Search by maker’s reference…",
    location: "Search by location…",
    ean: "Search by EAN…",
  };

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

  async function load() {
    setLoading(true);
    try {
        const data = await apiGet(
          `/api/parts?q=${encodeURIComponent(debouncedQ)}&field=${searchField}&limit=${limit}`
        );
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [debouncedQ, limit, searchField]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleWishlist(partNumber) {
    try {
      const res = await apiPost(`/api/wishlist/toggle/${encodeURIComponent(partNumber)}`);
      setRows((prev) =>
        prev.map((p) => (p.number === partNumber ? { ...p, wishlisted: res.wishlisted ? 1 : 0 } : p))
      );
    } catch (e) {
      console.error(e);
    }
  }

  // Global key handler for Escape key to focus search and clear on double-press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== "Escape") return;

      const now = Date.now();
      const delta = now - lastEscRef.current;

      // Always focus search input on first Esc
      searchRef.current?.focus();

      // If pressed twice within 400ms → clear
      if (delta < 400) {
        setQ("");
      }

      lastEscRef.current = now;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function onScanKeyDown(e) {
    if (e.key === "Enter") {
      const val = e.currentTarget.value.trim();
      if (val) setQ(val);
      e.currentTarget.value = "";
    }
  }

  // Filter by Stock Class field: Engine = "E", Electric = "EL"
  const filteredRows = rows.filter((p) => {
    if (stockClass === "all") return true;

    // Dataset says the field is literally "Stock Class"
    const raw = p?.["stock_class"];

    const v = String(raw ?? "").trim().toUpperCase();

    if (stockClass === "engine") return v === "E";
    if (stockClass === "electric") return v === "EL";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--rb-text)]">Parts</h1>
          <p className="text-sm text-[var(--rb-muted)]">
            Search by number, name, EAN, maker reference, or location.
          </p>
        </div>

        {/* Search field buttons */}
        <div className="flex flex-wrap gap-2 mb-1">
          {[
            { key: "all", label: "All" },
            { key: "name", label: "Name" },
            { key: "makers_ref", label: "Maker’s ref" },
            { key: "location", label: "Location" },
            { key: "ean", label: "EAN" },
          ].map((b) => (
            <button
              key={b.key}
              onClick={() => setSearchField(b.key)}
              className={[
                "px-4 py-2 rounded-xl text-base font-semibold border transition",
                "bg-[var(--rb-surface)]/40 border-[var(--rb-border)]",
                searchField === b.key
                  ? "text-[var(--rb-text)] ring-1 ring-[var(--rb-accent)]/45"
                  : "text-[var(--rb-muted)] hover:bg-[var(--rb-base)]/70 hover:text-[var(--rb-text)]",
              ].join(" ")}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Limit */}
        <div className="flex gap-2 items-center">
          <label className="text-xs text-[var(--rb-dim)]">Limit</label>
          <div className="relative">
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="
                appearance-none
                bg-[var(--rb-surface)]
                border border-[var(--rb-border)]
                rounded-lg
                px-4 py-2 pr-10
                text-sm text-[var(--rb-text)]
                outline-none
                focus:ring-2 focus:ring-[var(--rb-accent)]/35
                cursor-pointer
              "
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--rb-muted)]">
              ▾
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {/* Search input + Refresh */}
          <div className="flex gap-2">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholderMap[searchField]}
              className="w-full bg-[var(--rb-surface)]/30 border border-[var(--rb-border)] rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-[var(--rb-accent)]/35"
            />
            <button
              onClick={load}
              className="px-5 py-3 rounded-2xl bg-[var(--rb-base)] border border-[var(--rb-border)] text-sm font-semibold text-[var(--rb-text)] hover:bg-[var(--rb-surface)]/70 transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-[var(--rb-muted)]">Loading…</div>
          ) : (
            <div className="space-y-3">
              {filteredRows.length === 0 ? (
                <div className="text-sm text-[var(--rb-muted)] border border-[var(--rb-border)] rounded-2xl p-4 bg-[var(--rb-surface)]/20">
                  No matches.
                </div>
              ) : (
                filteredRows.map((p) => (
                  <PartCard
                    key={p.number}
                    part={p}
                    onToggleWishlist={toggleWishlist}
                    onRobUpdated={onRobUpdated}
                    robFlash={robFlashKey === p.number}
                    pushToast={pushToast}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          {/* Stock Class filter (above Scan box) */}
          <div className="border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4">
            <h2 className="text-lg font-semibold text-[var(--rb-text)]">Stock Class</h2>
            <p className="mt-1 text-xs text-[var(--rb-muted)]">Filter the list by stock class.</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "engine", label: "Engine" },
                { key: "electric", label: "Electric" },
              ].map((b) => (
                <button
                  key={b.key}
                  onClick={() => setStockClass(b.key)}
                  className={[
                    "px-4 py-2 rounded-xl text-base font-semibold border transition",
                    "bg-[var(--rb-surface)]/40 border-[var(--rb-border)]",
                    stockClass === b.key
                      ? "text-[var(--rb-text)] ring-1 ring-[var(--rb-accent)]/45"
                      : "text-[var(--rb-muted)] hover:bg-[var(--rb-base)]/70 hover:text-[var(--rb-text)]",
                  ].join(" ")}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="mt-3 text-xs text-[var(--rb-muted)]">
              Showing <span className="font-semibold text-[var(--rb-text)]">{filteredRows.length}</span>{" "}
              of <span className="font-semibold text-[var(--rb-text)]">{rows.length}</span> parts
            </div>
          </div>

          {/* Scan box */}
          <div className="border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4">
            <h2 className="text-lg font-semibold text-[var(--rb-text)]">Scan box</h2>
            <p className="mt-1 text-xs text-[var(--rb-muted)]">
              If your scanner acts like a keyboard, scan here (search triggers on Enter).
            </p>
            <input
              ref={scanRef}
              onKeyDown={onScanKeyDown}
              placeholder="Click here, then scan…"
              className="mt-3 w-full bg-[var(--rb-surface)]/30 border border-[var(--rb-border)] rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-[var(--rb-accent)]/35"
            />
            <button
              onClick={() => scanRef.current?.focus()}
              className="mt-3 w-full px-4 py-3 rounded-xl bg-[var(--rb-base)] border border-[var(--rb-border)] text-sm font-semibold text-[var(--rb-text)] hover:bg-[var(--rb-surface)]/70 transition"
            >
              Focus scan box
            </button>
          </div>

          {/* Quick tips */}
          <div className="border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4">
            <h2 className="text-lg font-semibold text-[var(--rb-text)]">Quick tips</h2>
            <ul className="mt-2 text-xs text-[var(--rb-muted)] space-y-2 list-disc pl-4">
              <li>Search is fuzzy: partial matches work.</li>
              <li>Wishlist is stored locally in SQLite.</li>
              <li>Parts import wipes parts (wishlist exported first).</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function useDebounced(value, delayMs) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}
