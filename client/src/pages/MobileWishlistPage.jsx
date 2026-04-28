import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MobileLayout from "../components/MobileLayout.jsx";
import { apiGet, apiPost } from "../api.js";

/**
 * MobileWishlistPage: Mobile interface for viewing and managing wishlist items.
 * Shows items marked as missing parts or desired for future stock.
 */

export default function MobileWishlistPage({ pushToast }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    setLoading(true);
    setError("");

    try {
      // Fetch wishlist items from API
      // TODO: Adapt to actual wishlist API endpoint if different
      const data = await apiGet("/api/wishlist");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.message || "Failed to load wishlist";
      setError(msg);
      console.error("Load wishlist error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFromWishlist(partNumber) {
    try {
      await apiPost(
        `/api/wishlist/toggle/${encodeURIComponent(partNumber)}`,
        {}
      );
      setItems((prev) => prev.filter((item) => item.number !== partNumber));
      pushToast?.("success", "Removed from wishlist");
    } catch (err) {
      const msg = err?.message || "Failed to remove from wishlist";
      pushToast?.("error", msg);
      console.error("Remove from wishlist error:", err);
    }
  }

  if (loading) {
    return (
      <MobileLayout showBack onBack={() => navigate("/roboard/mobile/scan")}>
        <div className="text-center py-12">
          <p className="text-[var(--rb-muted)]">Loading wishlist...</p>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout showBack onBack={() => navigate("/roboard/mobile/scan")}>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 text-red-200">
            <p className="font-semibold text-lg">❌ Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate("/roboard/mobile/scan")}
            className="w-full h-16 px-4 py-3 rounded-xl bg-[var(--rb-accent)] text-[var(--rb-text)] font-bold text-lg transition hover:bg-[var(--rb-accent-hover)] active:scale-95"
          >
            Back to Scan
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBack onBack={() => navigate("/roboard/mobile/scan")}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--rb-text)]">Wishlist</h1>
          <p className="text-lg text-[var(--rb-muted)]">
            Missing parts and items to stock: {items.length}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-[var(--rb-surface)]/50 border border-[var(--rb-border)] rounded-xl p-8 text-center">
            <p className="text-lg text-[var(--rb-muted)]">
              No items on wishlist yet. Search for parts and mark them as missing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.number}
                className="p-6 rounded-xl bg-[var(--rb-surface)] border border-[var(--rb-border)] space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[var(--rb-text)]">
                    {item.name}
                  </h3>
                  {item.number && (
                    <p className="text-lg font-mono text-[var(--rb-muted)]">
                      {item.number}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveFromWishlist(item.number)}
                  className="w-full h-14 px-4 py-2 rounded-lg bg-red-900/30 border border-red-500/50 text-red-200 font-semibold transition hover:bg-red-900/50 active:scale-95"
                >
                  Remove from Wishlist
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/roboard/mobile/scan")}
          className="w-full h-16 px-4 py-3 rounded-xl bg-[var(--rb-accent)] text-[var(--rb-text)] font-bold text-lg transition hover:bg-[var(--rb-accent-hover)] active:scale-95"
        >
          ← Back to Scan
        </button>
      </div>
    </MobileLayout>
  );
}
