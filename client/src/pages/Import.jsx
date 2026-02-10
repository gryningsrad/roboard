import { useState } from "react";
import { apiPost } from "../api.js";

export default function ImportPage({ pushToast }) {
  const [partsFile, setPartsFile] = useState(null);
  const [ordersFile, setOrdersFile] = useState(null);

  const [busyParts, setBusyParts] = useState(false);
  const [busyOrders, setBusyOrders] = useState(false);

  const [lastParts, setLastParts] = useState(null);
  const [lastOrders, setLastOrders] = useState(null);

  const [confirmPartsOpen, setConfirmPartsOpen] = useState(false);
  const [confirmOrdersOpen, setConfirmOrdersOpen] = useState(false);

  async function importParts() {
    if (!partsFile) {
      pushToast("error", "Select a Parts .xlsx file first.");
      return;
    }
    setBusyParts(true);
    setLastParts(null);
    try {
      const fd = new FormData();
      fd.append("file", partsFile);
      const res = await apiPost("/api/import/parts", fd);
      setLastParts(res);
      pushToast(
        "success",
        `Parts imported: ${res.parts_imported}. Wishlist exported to: ${res.exported_wishlist_file}`
      );
    } catch (e) {
      pushToast("error", e?.message || "Parts import failed.");
    } finally {
      setBusyParts(false);
    }
  }

  async function importOrders() {
    if (!ordersFile) {
      pushToast("error", "Select an Orders .xlsx file first.");
      return;
    }
    setBusyOrders(true);
    setLastOrders(null);
    try {
      const fd = new FormData();
      fd.append("file", ordersFile);
      const res = await apiPost("/api/import/orders", fd);
      setLastOrders(res);
      pushToast("success", `Orders imported: ${res.orders_imported}.`);
    } catch (e) {
      pushToast("error", e?.message || "Orders import failed.");
    } finally {
      setBusyOrders(false);
    }
  }

  function requestImportParts() {
    if (!partsFile) {
      pushToast("error", "Select a Parts .xlsx file first.");
      return;
    }
    setConfirmPartsOpen(true);
  }

  function requestImportOrders() {
    if (!ordersFile) {
      pushToast("error", "Select an Orders .xlsx file first.");
      return;
    }
    setConfirmOrdersOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--rb-text)]">Import</h1>
        <p className="text-sm text-[var(--rb-muted)]">
          Imports are split into <span className="font-semibold text-[var(--rb-text)]">Parts</span>{" "}
          and <span className="font-semibold text-[var(--rb-text)]">Orders</span>. Parts import exports the wishlist to USB
          first, then replaces all parts.
        </p>
      </div>

      <div className="border border-[var(--rb-accent)]/35 rounded-2xl bg-[var(--rb-surface)]/20 p-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--rb-accent)] font-extrabold">
          Warning
        </div>
        <div className="mt-1 text-sm text-[var(--rb-text)] font-semibold">
          Import replaces data. Use the latest export from your source system.
        </div>
        <div className="mt-1 text-xs text-[var(--rb-muted)]">
          Procedure: verify file → import → spot-check → continue operations.
        </div>
      </div>

      <Section
        title="Import Parts"
        subtitle="Exports wishlist to USB first. Then replaces all parts."
        file={partsFile}
        setFile={setPartsFile}
        busy={busyParts}
        onRequest={requestImportParts}
        buttonLabel={busyParts ? "Importing…" : "Import Parts (Replace All)"}
      />

      {lastParts ? (
        <ResultCard title="Last Parts import result">
          <ResultRow label="Parts imported" value={String(lastParts.parts_imported)} />
          <ResultRow label="USB detected" value={lastParts.usb_detected ? "Yes" : "No"} />
          <ResultRow label="Wishlist exported to" value={lastParts.exported_wishlist_file} mono />
          <ResultRow label="Sheet used" value={lastParts.sheet_used} mono />
        </ResultCard>
      ) : null}

      <Section
        title="Import Orders"
        subtitle="Replaces all orders (header list)."
        file={ordersFile}
        setFile={setOrdersFile}
        busy={busyOrders}
        onRequest={requestImportOrders}
        buttonLabel={busyOrders ? "Importing…" : "Import Orders (Replace All)"}
      />

      {lastOrders ? (
        <ResultCard title="Last Orders import result">
          <ResultRow label="Orders imported" value={String(lastOrders.orders_imported)} />
          <ResultRow label="Sheet used" value={lastOrders.sheet_used} mono />
        </ResultCard>
      ) : null}

      <div className="border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4">
        <h2 className="text-sm font-semibold text-[var(--rb-text)]">File expectations</h2>
        <ul className="mt-2 text-sm text-[var(--rb-muted)] list-disc pl-5 space-y-1">
          <li>
            Parts import expects sheet <span className="font-mono text-[var(--rb-text)]">Parts</span> (or a single-sheet
            workbook).
          </li>
          <li>
            Orders import expects sheet <span className="font-mono text-[var(--rb-text)]">Orders</span> (or a single-sheet
            workbook).
          </li>
          <li>
            Column <span className="font-mono text-[var(--rb-text)]">Number</span> must exist.
          </li>
        </ul>
      </div>

      {/* Confirm: Parts */}
      {confirmPartsOpen ? (
        <ConfirmModal
          title="Import Parts (Replace All)?"
          subtitle={
            <>
              File: <span className="font-mono text-[var(--rb-text)]">{partsFile?.name}</span>
            </>
          }
          body={
            <>
              This will:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Export the wishlist first (USB if detected)</li>
                <li>
                  <span className="font-semibold text-[var(--rb-text)]">Replace all parts</span> in the local database
                </li>
              </ul>
              <div className="mt-3 text-xs text-[var(--rb-dim)]">
                Proceed only if the file is correct.
              </div>
            </>
          }
          confirmLabel={busyParts ? "Importing…" : "Import Parts"}
          busy={busyParts}
          onCancel={() => setConfirmPartsOpen(false)}
          onConfirm={async () => {
            setConfirmPartsOpen(false);
            await importParts();
          }}
        />
      ) : null}

      {/* Confirm: Orders */}
      {confirmOrdersOpen ? (
        <ConfirmModal
          title="Import Orders (Replace All)?"
          subtitle={
            <>
              File: <span className="font-mono text-[var(--rb-text)]">{ordersFile?.name}</span>
            </>
          }
          body={
            <>
              This will <span className="font-semibold text-[var(--rb-text)]">replace all orders</span> in the local
              database.
              <div className="mt-3 text-xs text-[var(--rb-dim)]">
                Proceed only if the file is correct.
              </div>
            </>
          }
          confirmLabel={busyOrders ? "Importing…" : "Import Orders"}
          busy={busyOrders}
          onCancel={() => setConfirmOrdersOpen(false)}
          onConfirm={async () => {
            setConfirmOrdersOpen(false);
            await importOrders();
          }}
        />
      ) : null}
    </div>
  );
}

function Section({ title, subtitle, file, setFile, busy, onRequest, buttonLabel }) {
  return (
    <div className="border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--rb-text)]">{title}</h2>
        <p className="text-sm text-[var(--rb-muted)] mt-1">{subtitle}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--rb-text)]">Excel file (.xlsx)</label>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-[var(--rb-muted)]
            file:mr-4 file:py-2 file:px-4
            file:rounded-xl file:border-0
            file:text-sm file:font-semibold
            file:bg-[var(--rb-base)] file:text-[var(--rb-text)]
            hover:file:bg-[var(--rb-surface)]"
        />
        {file ? (
          <div className="text-xs text-[var(--rb-dim)]">
            Selected: <span className="font-mono text-[var(--rb-text)]">{file.name}</span>
          </div>
        ) : null}
      </div>

      <button
        onClick={onRequest}
        disabled={busy}
        className={[
          "w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-extrabold border transition",
          busy
            ? "bg-[var(--rb-surface)]/10 border-[var(--rb-border)] text-white/35 cursor-not-allowed"
            : "bg-[var(--rb-base)] border-[var(--rb-accent)]/45 text-[var(--rb-text)] hover:bg-[var(--rb-base)]/85 ring-1 ring-[var(--rb-accent)]/35",
        ].join(" ")}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ConfirmModal({ title, subtitle, body, confirmLabel, busy, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="w-full max-w-lg border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-bg)] p-5 shadow-xl">
        <h3 className="text-lg font-extrabold tracking-tight text-[var(--rb-text)]">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-2 text-sm text-[var(--rb-muted)]">{subtitle}</p>
        ) : null}

        <div className="mt-3 text-sm text-[var(--rb-muted)]">{body}</div>

        <div className="mt-5 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-[var(--rb-surface)]/20 hover:bg-[var(--rb-surface)]/35 border border-[var(--rb-border)] text-sm font-semibold text-[var(--rb-muted)] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-[var(--rb-base)] hover:bg-[var(--rb-base)]/85 border border-[var(--rb-accent)]/50 text-[var(--rb-text)] text-sm font-extrabold transition ring-1 ring-[var(--rb-accent)]/35 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>

        <div className="mt-3 text-xs text-[var(--rb-dim)]">
          Tip: Click outside to close (disabled while importing).
        </div>
      </div>
    </div>
  );
}

function ResultCard({ title, children }) {
  return (
    <div className="border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/20 p-4">
      <h3 className="text-sm font-semibold text-[var(--rb-text)]">{title}</h3>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[var(--rb-muted)]">
        {children}
      </div>
    </div>
  );
}

function ResultRow({ label, value, mono }) {
  return (
    <div className="flex gap-2">
      <span className="text-[var(--rb-dim)]">{label}:</span>
      <span className={mono ? "font-mono break-all text-[var(--rb-text)]" : "break-all text-[var(--rb-text)]"}>
        {value}
      </span>
    </div>
  );
}
