import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "../components/MobileLayout.jsx";
//import { useScannerInput } from "../hooks/useScannerInput.js";
import { apiGet } from "../api.js";

function normalizeScanValue(value) {
  if (!value) return "";

  const trimmed = value.trim();

  // Check if string starts with 13 digits (EAN-13)
  const match = trimmed.match(/^(\d{13})/);

  if (match) {
    // Return only the EAN part
    return match[1];
  }

  // Otherwise: user is typing → do not modify
  return value;
}

export default function MobileScan({ pushToast }) {
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const scanTimerRef = useRef(null);

  /*const { inputRef, handleScanSubmit, focusInput } = useScannerInput(
    handleSearch,
    setSearchValue
  );*/
  const inputRef = useRef(null);

  function focusInput() {
    inputRef.current?.focus();
  }

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  async function handleSearch(query) {
    const cleanedQuery = normalizeScanValue(query);

    if (!cleanedQuery) return;

    setSearchValue(cleanedQuery);
    setLoading(true);
    setError("");
    setHasSearched(true);
    setSearchResults([]);

    try {
      const data = await apiGet(
        `/api/parts?q=${encodeURIComponent(cleanedQuery)}&field=all&limit=50`
      );

      const results = Array.isArray(data) ? data : [];

      if (results.length === 0) {
        setSearchResults([]);
        pushToast?.("info", `No results found for "${cleanedQuery}"`);
      } else if (results.length === 1) {
        const asset = results[0];
        navigate(`/roboard/mobile/assets/${encodeURIComponent(asset.number)}`);
      } else {
        setSearchResults(results);
        navigate("/roboard/mobile/results", {
          state: { results, query: cleanedQuery },
        });
      }
    } catch (err) {
      const msg = err?.message || "Search failed";
      setError(msg);
      pushToast?.("error", msg);
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const cleaned = normalizeScanValue(e.target.value);
    setSearchValue(cleaned);
  }

  function handleFindPartClick() {
    const cleanedQuery = normalizeScanValue(searchValue);

    if (cleanedQuery) {
      handleSearch(cleanedQuery);
    }
  }

  return (
    <MobileLayout title="ROBoard Mobile">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-3xl font-bold text-[var(--rb-text)]">
              Scan Barcode
            </h2>
            <p className="text-lg text-[var(--rb-muted)]">
              Scan barcode or search spare part
            </p>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => {
              const cleaned = normalizeScanValue(e.target.value);
              setSearchValue(cleaned);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const cleaned = normalizeScanValue(e.currentTarget.value);
                if (cleaned) {
                  handleSearch(cleaned);
                }
              }
            }}
            placeholder="Scan barcode or type search..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full h-20 px-6 rounded-xl bg-[var(--rb-surface)] border-2 border-[var(--rb-accent)]/50 text-2xl text-[var(--rb-text)] placeholder-[var(--rb-muted)] outline-none transition focus:border-[var(--rb-accent)] focus:ring-2 focus:ring-[var(--rb-accent)]/20"
          />

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg text-blue-200 text-center">
              Searching...
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleFindPartClick}
            disabled={loading || !normalizeScanValue(searchValue)}
            className="h-24 px-4 py-3 rounded-xl bg-[var(--rb-accent)] text-[var(--rb-text)] font-bold text-lg transition hover:bg-[var(--rb-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            🔍 Find Part
          </button>

          <button
            onClick={() => navigate("/roboard/mobile/rob")}
            className="h-24 px-4 py-3 rounded-xl bg-[var(--rb-surface)] text-[var(--rb-text)] font-bold text-lg border-2 border-[var(--rb-accent)]/40 transition hover:bg-[var(--rb-base)] active:scale-95"
          >
            📊 Update ROB
          </button>

          <button
            onClick={() => navigate("/roboard/mobile/locations")}
            className="h-24 px-4 py-3 rounded-xl bg-[var(--rb-surface)] text-[var(--rb-text)] font-bold text-lg border-2 border-[var(--rb-accent)]/40 transition hover:bg-[var(--rb-base)] active:scale-95"
          >
            📍 Location
          </button>

          <button
            onClick={() => navigate("/roboard/mobile/wishlist")}
            className="h-24 px-4 py-3 rounded-xl bg-[var(--rb-surface)] text-[var(--rb-text)] font-bold text-lg border-2 border-[var(--rb-accent)]/40 transition hover:bg-[var(--rb-base)] active:scale-95"
          >
            ⭐ Wishlist
          </button>
        </div>

        <div className="bg-[var(--rb-surface)]/50 border border-[var(--rb-border)] rounded-xl p-6 space-y-2">
          <h3 className="text-lg font-semibold text-[var(--rb-text)]">
            📱 Tip
          </h3>
          <p className="text-[var(--rb-muted)]">
            This interface is optimized for handheld scanning devices. Scan
            barcodes directly or use the buttons above for specific tasks.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}