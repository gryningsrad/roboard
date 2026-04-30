import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MobileLayout from "../components/MobileLayout.jsx";
import { apiGet, apiPost } from "../api.js";

/**
 * MobileAssetDetail: Display detailed information about a spare part.
 * 
 * Shows the most important fields for the asset and provides action buttons
 * for updating ROB, changing location, adding to wishlist, etc.
 */

export default function MobileAssetDetail({ pushToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRobInput, setShowRobInput] = useState(false);
  const [robValue, setRobValue] = useState("");
  const [savingRob, setSavingRob] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    loadAsset();
  }, [id]);

  async function loadAsset() {
    setLoading(true);
    setError("");

    try {
      // TODO: Adapt this endpoint to match actual API.
      // For now, assuming we can fetch a single part by its number/id.
      const data = await apiGet(
        `/api/parts?q=${encodeURIComponent(id)}&field=all&limit=1`
      );

      const results = Array.isArray(data) ? data : [];
      if (results.length === 0) {
        setError(`Asset not found: ${id}`);
        setAsset(null);
      } else {
        setAsset(results[0]);
        setWishlisted(!!results[0].wishlisted);
        setRobValue(
          results[0].rob !== null && results[0].rob !== undefined
            ? String(results[0].rob)
            : ""
        );
      }
    } catch (err) {
      const msg = err?.message || "Failed to load asset";
      setError(msg);
      console.error("Load asset error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRob() {
    const numVal = robValue.trim();
    if (!numVal) {
      setShowRobInput(false);
      return;
    }

    const num = Number(numVal);
    if (!Number.isFinite(num)) {
      pushToast?.("error", "ROB must be a number");
      return;
    }

    setSavingRob(true);
    try {
      const res = await apiPost(
        `/api/rob/${encodeURIComponent(asset.number)}`,
        { rob: num }
      );
      setAsset((prev) => ({ ...prev, rob: res.rob, rob_updated_at: res.updated_at }));
      setRobValue(String(res.rob));
      setShowRobInput(false);
      pushToast?.("success", "ROB updated");
    } catch (err) {
      const msg = err?.message || "Failed to update ROB";
      pushToast?.("error", msg);
      console.error("Update ROB error:", err);
    } finally {
      setSavingRob(false);
    }
  }

  async function handleToggleWishlist() {
    try {
      const res = await apiPost(
        `/api/wishlist/toggle/${encodeURIComponent(asset.number)}`,
        {}
      );
      setWishlisted(res.wishlisted ? 1 : 0);
      pushToast?.("success", res.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    } catch (err) {
      const msg = err?.message || "Failed to toggle wishlist";
      pushToast?.("error", msg);
      console.error("Toggle wishlist error:", err);
    }
  }

  if (loading) {
    return (
      <MobileLayout showBack onBack={() => navigate("/m")}>
        <div className="text-center py-12">
          <p className="text-[var(--rb-muted)]">Loading asset...</p>
        </div>
      </MobileLayout>
    );
  }

  if (error || !asset) {
    return (
      <MobileLayout showBack onBack={() => navigate("/m")}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 text-red-200">
            <p className="font-semibold text-lg">❌ Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate("/m")}
            className="w-full h-16 px-4 py-2 rounded-xl bg-[var(--rb-accent)] text-[var(--rb-text)] font-bold text-lg transition hover:bg-[var(--rb-accent-hover)] active:scale-95"
          >
            Back to Scan
          </button>
        </div>
      </MobileLayout>
    );
  }

  const currentLocation =
    (asset.overridden_location && asset.overridden_location.trim()) ||
    (asset.default_location && asset.default_location.trim()) ||
    "Not set";

  const currentRob = asset.rob !== null && asset.rob !== undefined ? asset.rob : "Not set";

  return (
    <MobileLayout showBack onBack={() => navigate("/m")}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Asset Header */}
        <div className="space-y-4 bg-[var(--rb-surface)]/50 border border-[var(--rb-border)] rounded-xl p-6">
          <h1 className="text-3xl font-bold text-[var(--rb-text)]">{asset.name}</h1>

          {/* Key Fields */}
          <div className="grid grid-cols-1 gap-4 text-lg">
            {asset.number && (
              <div className="flex justify-between items-start">
                <span className="text-[var(--rb-muted)]">Part Number:</span>
                <span className="text-xs font-mono text-green-400 bg-green-950/40 border border-green-700/50 px-2 py-1 rounded-lg">
                  {asset.number}
                </span>
              </div>
            )}

            {asset.makers_ref && (
              <div className="flex justify-between items-start">
                <span className="text-[var(--rb-muted)]">Maker Ref:</span>
                <span className="text-[var(--rb-text)] font-semibold">{asset.makers_ref}</span>
              </div>
            )}

            {asset.ean && (
              <div className="flex justify-between items-start">
                <span className="text-[var(--rb-muted)]">Barcode (EAN):</span>
                <span className="text-[var(--rb-text)] font-mono">{asset.ean}</span>
              </div>
            )}

            {(asset.rob !== null && asset.rob !== undefined) || asset.unit ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-start">
                  <span className="text-[var(--rb-muted)]">ROB:</span>
                  <span className="text-[var(--rb-accent)] font-bold text-2xl">{currentRob}</span>
                </div>

                {asset.unit && (
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--rb-muted)]">Unit:</span>
                    <span className="text-[var(--rb-text)]">{asset.unit}</span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-between items-start">
              <span className="text-[var(--rb-muted)]">Location:</span>
              <span className="text-xs font-semibold px-2 py-1 rounded-md border border-yellow-700/60 bg-yellow-900/60 text-yellow-200">
                {currentLocation}
              </span>
            </div>

            {asset.rob_updated_at && (
              <div className="flex justify-between items-start text-sm">
                <span className="text-[var(--rb-dim)]">Last ROB update:</span>
                <span className="text-[var(--rb-dim)]">
                  {new Date(asset.rob_updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ROB Update Input (collapsible) */}
        {showRobInput && (
          <div className="bg-[var(--rb-surface)] border border-[var(--rb-accent)]/50 rounded-xl p-6 space-y-4">
            <label className="block text-lg font-semibold text-[var(--rb-text)]">
              Update ROB
            </label>
            <input
              type="number"
              value={robValue}
              onChange={(e) => setRobValue(e.target.value)}
              placeholder={`Current: ${currentRob}`}
              className="w-full h-16 px-6 rounded-lg bg-[var(--rb-bg)] border border-[var(--rb-border)] text-xl text-[var(--rb-text)] placeholder-[var(--rb-muted)] outline-none focus:border-[var(--rb-accent)] focus:ring-2 focus:ring-[var(--rb-accent)]/20"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRobInput(false)}
                className="h-14 px-4 py-2 rounded-lg bg-[var(--rb-surface)] border border-[var(--rb-border)] text-[var(--rb-text)] font-semibold transition hover:bg-[var(--rb-base)] active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRob}
                disabled={savingRob}
                className="h-14 px-4 py-2 rounded-lg bg-[var(--rb-accent)] text-[var(--rb-text)] font-semibold transition hover:bg-[var(--rb-accent-hover)] disabled:opacity-50 active:scale-95"
              >
                {savingRob ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {/* Update ROB */}
          <button
            onClick={() => {
              setShowRobInput(!showRobInput);
              if (!showRobInput) setRobValue("");
            }}
            className="h-20 px-4 py-3 rounded-xl bg-[var(--rb-surface)] text-orange-400 font-bold text-lg border-2 border-[var(--rb-accent)]/40 transition hover:bg-[var(--rb-base)] active:scale-95"
          >
            ROB
          </button>

          {/* Change Location (TODO) */}
          <button
            onClick={() => pushToast?.("info", "Change location feature coming soon")}
            className="h-20 px-4 py-3 rounded-xl bg-[var(--rb-surface)] text-[var(--rb-text)] font-bold text-lg border-2 border-[var(--rb-accent)]/40 transition hover:bg-[var(--rb-base)] active:scale-95"
          >
            📍 Location
          </button>

          {/* Add to Wishlist */}
          <button
            onClick={handleToggleWishlist}
            className={`h-20 px-4 py-3 rounded-xl font-bold text-lg border-2 transition active:scale-95 ${
              wishlisted
                ? "bg-[var(--rb-accent)] text-[var(--rb-text)] border-[var(--rb-accent)]"
                : "bg-[var(--rb-surface)] text-[var(--rb-text)] border-[var(--rb-accent)]/40 hover:bg-[var(--rb-base)]"
            }`}
          >
            {wishlisted ? "❌ Wishlist" : "⭐ Wishlist"}
          </button>

          {/* Back to Scan */}
          <button
            onClick={() => navigate("/m")}
            className="h-20 px-4 py-3 rounded-xl bg-[var(--rb-surface)] text-[var(--rb-text)] font-bold text-lg border-2 border-[var(--rb-accent)]/40 transition hover:bg-[var(--rb-base)] active:scale-95"
          >
            ← Back
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
