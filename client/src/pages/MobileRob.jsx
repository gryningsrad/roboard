import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/MobileLayout.jsx";

/**
 * MobileRob: Mobile interface for updating ROB (Running Operational Budget) values.
 * Currently a placeholder that directs users back to scan and search for a part first.
 */

export default function MobileRob() {
  const navigate = useNavigate();

  return (
    <MobileLayout showBack onBack={() => navigate("/roboard/mobile/scan")}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-[var(--rb-text)]">Update ROB</h1>
          <p className="text-lg text-[var(--rb-muted)]">
            Search for a spare part first to update its ROB value.
          </p>
        </div>

        <div className="bg-[var(--rb-surface)]/50 border border-[var(--rb-border)] rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-[var(--rb-muted)]">
              ROB stands for Running Operational Budget — the quantity of spare parts to keep in stock.
            </p>
            <p className="text-[var(--rb-muted)]">
              To update a ROB value:
            </p>
            <ol className="list-decimal list-inside text-[var(--rb-muted)] space-y-1 ml-2">
              <li>Go back to scan</li>
              <li>Search for or scan a spare part</li>
              <li>Open the asset details</li>
              <li>Tap "Update ROB" and enter the new value</li>
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
