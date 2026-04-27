import { Link, NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Parts" },
  { to: "/rob", label: "ROB", countKey: "rob" },
  { to: "/wishlist", label: "Wishlist", countKey: "wishlist" },
  { to: "/locations", label: "Locations", countKey: "locations" },
  { to: "/import", label: "Import" },
];

function formatLabel(label, count) {
  if (count === null || count === undefined) return label;

  return (
    <>
      <span>{label}</span>{" "}
      <span className="text-sm text-[var(--rb-accent)]">({count})</span>
    </>
  );
}

function NavItem({ to, label, count }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "px-5 py-3 rounded-xl text-base font-semibold transition",
          isActive
            ? "bg-[var(--rb-base)] text-[var(--rb-text)] ring-1 ring-[var(--rb-accent)]/40"
            : "text-[var(--rb-muted)] hover:bg-[var(--rb-base)] hover:text-[var(--rb-text)]",
        ].join(" ")
      }
    >
      <span className="inline-flex items-center gap-2">
        {formatLabel(label, count)}
      </span>
    </NavLink>
  );
}

export default function Shell({ children, navCounts }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--rb-border)] bg-[var(--rb-bg)]/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between gap-6">
          <Link
            to="/"
            className="flex items-center gap-4 rounded-2xl transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--rb-accent)]/35"
            aria-label="Go to Parts search"
          >
            <div className="h-14 w-14 rounded-2xl bg-[var(--rb-surface)] grid place-items-center">
              <span className="text-lg font-extrabold tracking-tight text-[var(--rb-text)]">
                <span className="text-[var(--rb-accent)]">R</span>B
              </span>
            </div>

            <div className="leading-tight">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none">
                <span className="text-[var(--rb-accent)]">ROB</span>
                <span className="text-[var(--rb-text)]">oard</span>
              </div>
              <div className="mt-1 text-xs sm:text-sm uppercase tracking-[0.18em] text-[var(--rb-dim)]">
                Remaining On Board – Under Control
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 bg-[var(--rb-surface)]/70 border border-[var(--rb-border)] rounded-2xl p-2">
            {navItems.map((n) => (
              <NavItem
                key={n.to}
                to={n.to}
                label={n.label}
                count={n.countKey ? navCounts?.[n.countKey] : null}
              />
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="border-t border-white/10 mt-10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/55 flex items-center justify-between">
          <span>Runs on this Raspberry Pi (localhost)</span>
          <span className="hidden sm:inline">
            Tip: barcode scanners usually type into the focused input
          </span>
        </div>
      </footer>
    </div>
  );
}
