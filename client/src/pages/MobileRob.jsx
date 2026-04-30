import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/MobileLayout.jsx";
import { apiGet } from "../api.js";

/**
 * MobileRob: Mobile interface for viewing and updating ROB (Running Operational Budget) values.
 * Displays a list of spare parts that have ROB values set.
 */

export default function MobileRob({ pushToast }) {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPartsWithRob();
  }, []);

  async function loadPartsWithRob() {
    setLoading(true);
    setError("");

    try {
      const data = await apiGet("/api/parts?limit=200");
      const results = Array.isArray(data) ? data : [];
      
      // Filter for parts that have ROB values set
      const withRob = results.filter(
        (part) => part.rob !== null && part.rob !== undefined
      );
      
      setParts(withRob);
      if (withRob.length === 0) {
        pushToast?.("info", "No parts with ROB values set yet");
      }
    } catch (err) {
      const msg = err?.message || "Failed to load parts";
      setError(msg);
      pushToast?.("error", msg);
      console.error("Load parts error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPart(partNumber) {
    navigate(`/m/assets/${encodeURIComponent(partNumber)}`);
  }

  if (loading) {
    return (
      <MobileLayout showBack onBack={() => navigate("/m")}>
        <div className="text-center py-12">
          <p className="text-[var(--rb-muted)]">Loading parts...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBack onBack={() => navigate("/m")} title="Parts with ROB">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--rb-text)]">Parts with ROB</h1>
          <p className="text-lg text-[var(--rb-muted)]">
            {parts.length} part{parts.length !== 1 ? "s" : ""} with ROB values set
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-6 text-red-200">
            <p className="font-semibold text-lg">❌ Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {parts.length === 0 && !error && (
          <div className="bg-[var(--rb-surface)]/50 border border-[var(--rb-border)] rounded-xl p-6 text-center space-y-4">
            <p className="text-[var(--rb-muted)] text-lg">No parts with ROB values set yet</p>
            <button
              onClick={() => navigate("/m")}
              className="w-full h-14 px-4 py-2 rounded-xl bg-[var(--rb-accent)] text-[var(--rb-text)] font-bold text-lg transition hover:bg-[var(--rb-accent-hover)] active:scale-95"
            >
              ← Back to Scan
            </button>
          </div>
        )}

        {/* Parts List */}
        {parts.length > 0 && (
          <div className="space-y-4">
            {parts.map((part) => (
              <button
                key={part.number}
                onClick={() => handleSelectPart(part.number)}
                className="w-full text-left p-6 rounded-xl bg-[var(--rb-surface)] border border-[var(--rb-border)] transition hover:bg-[var(--rb-base)] hover:border-[var(--rb-accent)]/50 active:scale-95"
              >
                <div className="space-y-3">
                  {/* Part Name */}
                  <h2 className="text-2xl font-bold text-[var(--rb-text)]">
                    {part.name}
                  </h2>

                  {/* Part Number & Maker Ref Row */}
                  <div className="flex flex-wrap gap-4 text-lg">
                    {part.number && (
                      <div>
                        <p className="text-[var(--rb-muted)] text-sm">Part Number</p>
                        <p className="text-[var(--rb-text)] font-semibold font-mono">
                          {part.number}
                        </p>
                      </div>
                    )}

                    {part.makers_ref && (
                      <div>
                        <p className="text-[var(--rb-muted)] text-sm">Maker Ref</p>
                        <p className="text-[var(--rb-text)] font-semibold">
                          {part.makers_ref}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ROB & Location Row */}
                  <div className="flex flex-wrap gap-4 text-lg pt-2 border-t border-[var(--rb-border)]">
                    <div>
                      <p className="text-[var(--rb-muted)] text-sm">ROB</p>
                      <p className="text-[var(--rb-accent)] font-bold text-2xl">
                        {part.rob}
                      </p>
                    </div>

                    <div>
                      <p className="text-[var(--rb-muted)] text-sm">Location</p>
                      <p className="text-[var(--rb-text)] font-semibold">
                        {(part.overridden_location && part.overridden_location.trim()) ||
                          (part.default_location && part.default_location.trim()) ||
                          "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Back to Scan Button */}
        {parts.length > 0 && (
          <button
            onClick={() => navigate("/m")}
            className="w-full h-16 px-4 py-3 rounded-xl bg-[var(--rb-accent)] text-[var(--rb-text)] font-bold text-lg transition hover:bg-[var(--rb-accent-hover)] active:scale-95"
          >
            ← Back to Scan
          </button>
        )}
      </div>
    </MobileLayout>
  );
}
