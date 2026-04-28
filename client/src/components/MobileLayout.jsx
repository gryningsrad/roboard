/**
 * MobileLayout: A full-screen, handheld-friendly layout for mobile/scanner devices.
 * Designed for 1440x720 Android devices with landscape orientation preference.
 * Features large touch targets, readable typography, and minimal clutter.
 */

export default function MobileLayout({ children, title = "ROBoard", showBack = false, onBack = null }) {
  return (
    <div className="min-h-screen bg-[var(--rb-bg)] flex flex-col">
      {/* Mobile Header */}
      <header className="bg-[var(--rb-base)] border-b border-[var(--rb-border)] py-4 px-6 flex items-center justify-between gap-4">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="text-2xl font-bold text-[var(--rb-text)] hover:text-[var(--rb-accent)] transition active:opacity-75"
            aria-label="Go back"
          >
            ←
          </button>
        ) : (
          <div className="text-2xl font-bold text-[var(--rb-text)]">
            {title}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
