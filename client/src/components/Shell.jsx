import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Parts" },
  { to: "/rob", label: "ROB" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/import", label: "Import" },
];

function NavItem({ to, label }) {
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
      {label}
    </NavLink>
  );
}

export default function Shell({ children }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--rb-border)] bg-[var(--rb-bg)]/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
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
          </div>

          <nav className="flex items-center gap-2 bg-[var(--rb-surface)]/70 border border-[var(--rb-border)] rounded-2xl p-2">
            {navItems.map((n) => (
              <NavItem key={n.to} to={n.to} label={n.label} />
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
