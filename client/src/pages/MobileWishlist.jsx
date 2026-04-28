import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/MobileLayout.jsx";

/**
 * MobileLocations: Mobile interface for managing spare part locations.
 * Currently a placeholder that directs users to search and then update locations via asset details.
 */

export default function MobileLocations() {
  const navigate = useNavigate();

  return (
    <MobileLayout showBack onBack={() => navigate("/roboard/mobile/scan")}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-[var(--rb-text)]">Manage Locations</h1>
          <p className="text-lg text-[var(--rb-muted)]">
            Search for a spare part first to change its location.
          </p>
        </div>

        <div className="bg-[var(--rb-surface)]/50 border border-[var(--rb-border)] rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-[var(--rb-muted)]">
              You can override the default location for spare parts to track their current physical location.
            </p>
            <p className="text-[var(--rb-muted)]">
              To change a location:
            </p>
            <ol className="list-decimal list-inside text-[var(--rb-muted)] space-y-1 ml-2">
              <li>Go back to scan</li>
              <li>Search for or scan a spare part</li>
              <li>Open the asset details</li>
              <li>Tap "Change Location" (feature coming soon)</li>
            </ol>
          </div>
        </div>

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
