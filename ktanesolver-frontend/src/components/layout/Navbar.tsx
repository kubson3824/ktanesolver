import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useRoundStore } from "../../store/useRoundStore";
import { StrikeIndicator } from "../StrikeIndicator";
import { StrikeButton } from "../StrikeButton";

const NAV_LINKS = [
  { to: "/setup", label: "Setup" },
  { to: "/rounds", label: "Rounds" },
] as const;

export default function Navbar() {
  const location = useLocation();
  const round = useRoundStore((state) => state.round);
  const currentBomb = useRoundStore((state) => state.currentBomb);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSolving = location.pathname.startsWith("/solve");

  return (
    <nav className="sticky top-0 z-40 bg-base-200/90 backdrop-blur-lg border-b border-base-300" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: logo + nav links */}
          <div className="flex items-center gap-6">
            <Link to="/setup" className="text-lg font-bold tracking-tight text-primary" aria-label="KTANE Solver home">
              KTANE Solver
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? "bg-primary/10 text-primary"
                      : "text-base-content/70 hover:text-base-content hover:bg-base-300/50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isSolving && round && (
                <span className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary/10 text-primary">
                  Solving
                </span>
              )}
            </div>
          </div>

          {/* Right: strike info + mobile toggle */}
          <div className="flex items-center gap-3">
            {/* Strike indicator when in solve mode */}
            {isSolving && currentBomb && (
              <div className="hidden sm:flex items-center gap-2">
                <StrikeIndicator className="text-sm" />
                <StrikeButton className="btn-xs" />
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="sm:hidden btn btn-ghost btn-sm btn-square"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="sm:hidden pb-4 border-t border-base-300 mt-2 pt-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-300/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isSolving && round && (
              <Link
                to={`/solve/${round.id}`}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary"
              >
                Solving — Round #{round.id.slice(0, 8)}
              </Link>
            )}
            {isSolving && currentBomb && (
              <div className="flex items-center gap-2 px-3 py-2">
                <StrikeIndicator className="text-sm" />
                <StrikeButton className="btn-xs" />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
