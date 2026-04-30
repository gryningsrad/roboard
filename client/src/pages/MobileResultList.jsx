import { useLocation, useNavigate } from "react-router-dom";
import MobileLayout from "../components/MobileLayout.jsx";

/**
 * MobileResultList: Display search results as a mobile-friendly list.
 * 
 * Shows multiple asset results from a search query.
 * Each result is a large clickable card showing key information.
 */

export default function MobileResultList() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const results = state.results || [];
  const query = state.query || "";

  function handleSelectAsset(assetNumber) {
    navigate(`/m/assets/${encodeURIComponent(assetNumber)}`);
  }

  return (
    <MobileLayout
      showBack
      onBack={() => navigate("/m")}
      title="Results"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--rb-text)]">
            Search Results
          </h1>
          <p className="text-lg text-[var(--rb-muted)]">
            Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
          </p>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {results.map((asset) => (
            <button
              key={asset.number}
              onClick={() => handleSelectAsset(asset.number)}
              className="w-full text-left p-6 rounded-xl bg-[var(--rb-surface)] border border-[var(--rb-border)] transition hover:bg-[var(--rb-base)] hover:border-[var(--rb-accent)]/50 active:scale-95"
            >
              <div className="space-y-3">
                {/* Asset Name */}
                <h2 className="text-2xl font-bold text-[var(--rb-text)]">
                  {asset.name}
                </h2>

                {/* Asset Number & Maker Ref Row */}
                <div className="flex flex-wrap gap-4 text-lg">
                  {asset.number && (
                    <div>
                      <p className="text-[var(--rb-muted)] text-sm">Part Number</p>
                      <p className="text-[var(--rb-text)] font-semibold font-mono">
                        {asset.number}
                      </p>
                    </div>
                  )}

                  {asset.makers_ref && (
                    <div>
                      <p className="text-[var(--rb-muted)] text-sm">Maker Ref</p>
                      <p className="text-[var(--rb-text)] font-semibold">
                        {asset.makers_ref}
                      </p>
                    </div>
                  )}
                </div>

                {/* Location & ROB Row */}
                <div className="flex flex-wrap gap-4 text-lg pt-2 border-t border-[var(--rb-border)]">
                  <div>
                    <p className="text-[var(--rb-muted)] text-sm">Location</p>
                    <p className="text-[var(--rb-text)] font-semibold">
                      {(asset.overridden_location && asset.overridden_location.trim()) ||
                        (asset.default_location && asset.default_location.trim()) ||
                        "Not set"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[var(--rb-muted)] text-sm">ROB</p>
                    <p className="text-[var(--rb-accent)] font-bold text-xl">
                      {asset.rob !== null && asset.rob !== undefined ? asset.rob : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Back to Scan Button */}
        <button
          onClick={() => navigate("/m")}
          className="w-full h-16 px-4 py-3 rounded-xl bg-[var(--rb-accent)] text-[var(--rb-text)] font-bold text-lg transition hover:bg-[var(--rb-accent-hover)] active:scale-95"
        >
          ← Back to Scan
        </button>
      </div>
    </MobileLayout>
  );
}
