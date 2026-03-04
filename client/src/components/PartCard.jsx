import { useEffect, useRef, useState } from "react";
import { apiPost } from "../api.js";

function PencilIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export default function PartCard({
  part,
  onToggleWishlist,
  onRobUpdated,
  onLocationUpdated, // NEW optional callback
  robFlash,
  pushToast,
}) {
  const wish = !!part.wishlisted;

  // -----------------------
  // ROB modal state
  // -----------------------
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

  // -----------------------
  // Location override state
  // -----------------------
  const oldLoc = (part.default_location || "").trim();
  const overrideLoc = (part.overridden_location || "").trim();
  const hasOverride = !!overrideLoc && overrideLoc !== oldLoc;

  const displayLoc = hasOverride ? overrideLoc : oldLoc;

  const [locOpen, setLocOpen] = useState(false);
  const [locVal, setLocVal] = useState(displayLoc || "");
  const [locNote, setLocNote] = useState("");
  const [savingLoc, setSavingLoc] = useState(false);
  const [locErr, setLocErr] = useState("");
  const locInputRef = useRef(null);

  // Keep modal default value in sync if the part changes in parent state
  // only update when modal is not open, otherwise the user may be typing
  useEffect(() => {
    const newDisplay = ((part.overridden_location || "").trim() && (part.overridden_location || "").trim() !== (part.default_location || "").trim())
      ? (part.overridden_location || "").trim()
      : (part.default_location || "").trim();

    if (!locOpen) {
      setLocVal(newDisplay || "");
    }
  }, [part.default_location, part.overridden_location, locOpen]);

  useEffect(() => {
    if (locOpen) {
      setLocErr("");
      setLocNote("");
      // clear the input so current location is only shown as placeholder
      setLocVal("");
      setTimeout(() => locInputRef.current?.focus(), 0);
    }
  }, [locOpen]);

  function openLoc() {
    setLocOpen(true);
  }

  function closeLoc() {
    setLocOpen(false);
    setLocErr("");
    setLocVal(displayLoc || "");
    setLocNote("");
  }

  async function commitLoc() {
    const v = (locVal || "").trim();
    const n = (locNote || "").trim();

    if (!v) {
      setLocErr("Location cannot be empty");
      pushToast?.("error", "Location cannot be empty");
      return;
    }

    setSavingLoc(true);
    setLocErr("");

    try {
      const res = await apiPost("/api/locations/set", {
        part_number: part.number,
        new_location: v,
        note: n || null,
      });

      // Let parent update its cached parts list (best UX)
      onLocationUpdated?.(part.number, v, res.updated_at);

      pushToast?.("success", `Location updated to "${v}"`);
      setLocOpen(false);
    } catch (e) {
      const msg = e?.message || "Failed to update location";
      setLocErr(msg);
      pushToast?.("error", msg);
    } finally {
      setSavingLoc(false);
    }
  }

  // -----------------------
  // Render
  // -----------------------
  return (
    <>
      <div className="border border-white/40 rounded-2xl bg-[var(--rb-surface)]/18 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          {/* LEFT: part info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-green-400 bg-green-950/40 border border-green-700/50 px-2 py-1 rounded-lg">
                {part.number}
              </span>

              {/* Location badge (shows override if exists) */}
              {displayLoc ? (
                <span
                  className={[
                    "text-xs font-semibold px-2 py-1 rounded-md border transition",
                    hasOverride
                      ? "text-yellow-200 bg-yellow-900/60 border-yellow-700/60"
                      : "text-amber-400 bg-amber-950/40 border-amber-700/50",
                  ].join(" ")}
                  title={hasOverride ? `Override: ${overrideLoc}` : `Default: ${oldLoc}`}
                >
                  {displayLoc.split("-")[0].trim()}
                </span>
              ) : (
                <span className="text-xs font-semibold text-white/50 bg-white/10 border border-white/25 px-2 py-1 rounded-md">
                  No location
                </span>
              )}

              {/* Small "change" control next to location */}
              <button
                type="button"
                onClick={openLoc}
                className={[
                  "inline-flex items-center justify-center w-7 h-7 rounded-md border transition",
                  hasOverride
                    ? "border-emerald-700/50 text-emerald-300 bg-emerald-950/30"
                    : "border-[var(--rb-border)] bg-[var(--rb-bg)]/40 text-[var(--rb-muted)] hover:text-[var(--rb-text)] hover:bg-[var(--rb-surface)]/35"
                ].join(" ")}
                title="Change location"
              >
              <PencilIcon className="w-4 h-4" />
            </button>
            </div>

            {/* If overridden, show old location beneath */}
            {hasOverride ? (
              <div className="mt-1 text-xs text-[var(--rb-dim)]">
                Old location: <span className="text-[var(--rb-muted)]">{oldLoc || "—"}</span>
              </div>
            ) : null}

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

            {part.location_updated_at ? (
              <div className="mt-1 text-xs text-[var(--rb-dim)]">
                Location updated: {part.location_updated_at}
              </div>
            ) : null}
          </div>

          {/* RIGHT: actions */}
          <div className="shrink-0 flex flex-col gap-2 w-40">
            {/* Wishlist */}
            <button
              onClick={() => onToggleWishlist(part.number)}
              className={[
                "w-full rounded-xl px-4 py-3 text-base font-semibold border transition",
                wish
                  ? "bg-[var(--rb-surface)]/45 border-yellow-600/70 text-yellow-300"
                  : "bg-[var(--rb-bg)]/60 border-white/40 text-[var(--rb-muted)] hover:bg-[var(--rb-base)]/70 hover:text-[var(--rb-text)]",
              ].join(" ")}
              title={wish ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wish ? "★ On Wishlist" : "☆ Wishlist"}
            </button>

            {/* ROB */}
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

      {/* LOCATION modal */}
      {locOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savingLoc) closeLoc();
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--rb-border)] bg-[var(--rb-bg)] p-5">
            <h2 className="text-base font-semibold text-[var(--rb-text)]">
              Change location
            </h2>
            <p className="mt-1 text-sm text-[var(--rb-muted)]">
              Part: <span className="font-mono text-[var(--rb-text)]">{part.number}</span>
            </p>

            <div className="mt-3 text-xs text-[var(--rb-dim)]">
              Current:{" "}
              <span className="text-[var(--rb-text)] font-medium">
                {displayLoc || "—"}
              </span>
              {hasOverride ? (
                <>
                  {" "}
                  (old: <span className="text-[var(--rb-muted)]">{oldLoc || "—"}</span>)
                </>
              ) : null}
            </div>

            <input
              ref={locInputRef}
              value={locVal}
              onChange={(e) => setLocVal(e.target.value)}
              placeholder={displayLoc ? `Current: ${displayLoc}` : "Enter new location"}
              className="mt-4 w-full bg-[var(--rb-surface)]/25 border border-[var(--rb-border)] rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-[var(--rb-accent)]/35"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!savingLoc) commitLoc();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  if (!savingLoc) closeLoc();
                }
              }}
              disabled={savingLoc}
            />

            <textarea
              value={locNote}
              onChange={(e) => setLocNote(e.target.value)}
              placeholder="Optional note (e.g. moved during inventory)"
              className="mt-3 w-full min-h-[84px] bg-[var(--rb-surface)]/25 border border-[var(--rb-border)] rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-[var(--rb-accent)]/35"
              disabled={savingLoc}
            />

            {locErr ? (
              <div className="mt-2 text-sm text-red-300">{locErr}</div>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeLoc}
                disabled={savingLoc}
                className="px-4 py-2 rounded-xl border border-[var(--rb-border)] bg-[var(--rb-bg)] text-sm text-[var(--rb-muted)] hover:bg-[var(--rb-surface)]/30 transition"
              >
                Cancel
              </button>
              <button
                onClick={commitLoc}
                disabled={savingLoc}
                className="px-4 py-2 rounded-xl border border-[var(--rb-accent)]/35 bg-[var(--rb-base)] text-sm font-semibold text-[var(--rb-text)] hover:bg-[var(--rb-base)]/85 transition"
              >
                {savingLoc ? "Saving…" : "Save / Close"}
              </button>
            </div>

            <div className="mt-3 text-xs text-[var(--rb-dim)]">
              Tip: Press <span className="text-[var(--rb-text)]">Enter</span> to save,{" "}
              <span className="text-[var(--rb-text)]">Esc</span> to cancel.
            </div>
          </div>
        </div>
      ) : null}

      {/* ROB modal (unchanged) */}
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
