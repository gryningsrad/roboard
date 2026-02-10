import { useEffect, useRef, useState } from "react";
import { apiPost } from "../api.js";

export default function PartCard({ part, onToggleWishlist, onRobUpdated, robFlash, pushToast }) {
  const wish = !!part.wishlisted;

  const [robOpen, setRobOpen] = useState(false);
  const [robVal, setRobVal] = useState(
    part.rob !== null && part.rob !== undefined ? String(part.rob) : ""
  );
  const [savingRob, setSavingRob] = useState(false);
  const [robErr, setRobErr] = useState("");

  const robInputRef = useRef(null);

  useEffect(() => {
    setRobVal(part.rob !== null && part.rob !== undefined ? String(part.rob) : "");
  }, [part.rob]);

  useEffect(() => {
    if (robOpen) {
      setRobErr("");
      setRobVal("");
      setTimeout(() => robInputRef.current?.focus(), 0);
    }
  }, [robOpen]);

  function closeRob() {
    setRobOpen(false);
    setRobErr("");
    setRobVal(part.rob !== null && part.rob !== undefined ? String(part.rob) : "");
  }

  async function commitRob() {
    const v = robVal.trim();

    if (v === "") {
      setRobOpen(false);
      setRobErr("");
      return;
    }

    const num = Number(v);

    if (!Number.isFinite(num)) {
      setRobErr("ROB must be a number");
      pushToast?.("error", "ROB must be a number");
      return;
    }

    setSavingRob(true);
    setRobErr("");

    try {
      const res = await apiPost(`/api/rob/${encodeURIComponent(part.number)}`, { rob: num });
      onRobUpdated?.(part.number, res.rob, res.updated_at);
      setRobOpen(false);
    } catch (e) {
      const msg = e?.message || "Failed to save ROB";
      setRobErr(msg);
      pushToast?.("error", msg);
    } finally {
      setSavingRob(false);
    }
  }

  const robLabel =
    part.rob !== null && part.rob !== undefined && part.rob !== ""
      ? `ROB: ${part.rob}`
      : "ROB: —";

  return (
    <>
      <div className="border border-[var(--rb-border)] rounded-2xl bg-[var(--rb-surface)]/18 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          {/* LEFT: part info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--rb-text)] bg-[var(--rb-bg)]/70 border border-[var(--rb-border)] px-2 py-1 rounded-lg">
                {part.number}
              </span>
              {part.default_location ? (
                <span className="text-xs text-[var(--rb-muted)] truncate">
                  {part.default_location}
                </span>
              ) : null}
            </div>

            <h3 className="mt-2 text-base font-semibold leading-snug text-[var(--rb-text)]">
              {part.name || <span className="text-white/45 italic">No name</span>}
            </h3>

            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[var(--rb-muted)]">
              <Info label="Maker ref" value={part.makers_reference} />
              <Info label="Vendor" value={part.pref_vendor_code} />
            </div>

            {part.rob_updated_at ? (
              <div className="mt-2 text-xs text-[var(--rb-dim)]">
                ROB updated: {part.rob_updated_at}
              </div>
            ) : null}
          </div>

          {/* RIGHT: actions */}
          <div className="shrink-0 flex flex-col gap-2 w-40">
            {/* Wishlist (secondary) */}
            <button
              onClick={() => onToggleWishlist(part.number)}
              className={[
                "w-full rounded-xl px-4 py-3 text-base font-semibold border transition",
                wish
                  ? "bg-[var(--rb-surface)]/45 border-[var(--rb-accent)]/35 text-[var(--rb-text)]"
                  : "bg-[var(--rb-bg)]/60 border-[var(--rb-border)] text-[var(--rb-muted)] hover:bg-[var(--rb-base)]/70 hover:text-[var(--rb-text)]",
              ].join(" ")}
              title={wish ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wish ? "★ Wishlisted" : "☆ Wishlist"}
            </button>

            {/* ROB (primary control) */}
            <button
              onClick={() => setRobOpen(true)}
              className={[
                "w-full rounded-xl px-4 py-3 text-base font-semibold border transition",
                "bg-[var(--rb-base)]/55 border-[var(--rb-accent)]/35 text-[var(--rb-text)] hover:bg-[var(--rb-base)]/80",
                robFlash ? "ring-2 ring-[var(--rb-accent)]/70" : "",
              ].join(" ")}
              title="Set Remaining On Board"
            >
              <span className="text-[var(--rb-accent)] font-extrabold">ROB</span>{" "}
              <span className="text-[var(--rb-text)]">
                {part.rob !== null && part.rob !== undefined && part.rob !== "" ? `: ${part.rob}` : ": —"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ROB modal */}
      {robOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savingRob) closeRob();
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--rb-border)] bg-[var(--rb-bg)] p-5">
            <h2 className="text-base font-semibold text-[var(--rb-text)]">
              Set <span className="text-[var(--rb-accent)] font-extrabold">ROB</span>
            </h2>
            <p className="mt-1 text-sm text-[var(--rb-muted)]">
              Part: <span className="font-mono text-[var(--rb-text)]">{part.number}</span>
            </p>

            <input
              ref={robInputRef}
              value={robVal}
              onChange={(e) => setRobVal(e.target.value)}
              inputMode="decimal"
              placeholder={
                part.rob !== null && part.rob !== undefined
                  ? `Current: ${part.rob}`
                  : "No ROB set"
              }
              className="mt-4 w-full bg-[var(--rb-surface)]/25 border border-[var(--rb-border)] rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-[var(--rb-accent)]/35"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!savingRob) commitRob();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  if (!savingRob) closeRob();
                }
              }}
              disabled={savingRob}
            />

            {robErr ? (
              <div className="mt-2 text-sm text-red-300">{robErr}</div>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeRob}
                disabled={savingRob}
                className="px-4 py-2 rounded-xl border border-[var(--rb-border)] bg-[var(--rb-bg)] text-sm text-[var(--rb-muted)] hover:bg-[var(--rb-surface)]/30 transition"
              >
                Cancel
              </button>
              <button
                onClick={commitRob}
                disabled={savingRob}
                className="px-4 py-2 rounded-xl border border-[var(--rb-accent)]/35 bg-[var(--rb-base)] text-sm font-semibold text-[var(--rb-text)] hover:bg-[var(--rb-base)]/85 transition"
              >
                {savingRob ? "Saving…" : "Save / Close"}
              </button>
            </div>

            <div className="mt-3 text-xs text-[var(--rb-dim)]">
              Tip: Press <span className="text-[var(--rb-text)]">Enter</span> to save,{" "}
              <span className="text-[var(--rb-text)]">Esc</span> to cancel.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-[var(--rb-dim)]">{label}:</span>
      <span className="truncate text-[var(--rb-muted)]">
        {value || <span className="text-white/45 italic">—</span>}
      </span>
    </div>
  );
}
