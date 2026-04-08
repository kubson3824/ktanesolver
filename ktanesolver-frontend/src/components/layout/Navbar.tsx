import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useRoundStore } from "../../store/useRoundStore";
import { StrikeIndicator } from "../StrikeIndicator";
import { StrikeButton } from "../StrikeButton";
import Breadcrumb from "./Breadcrumb";
import { formatRoundLabel, formatModuleDisplayName } from "../../lib/utils";

export default function Navbar() {
  const location = useLocation();
  const { roundId } = useParams();
  const currentBomb = useRoundStore((state) => state.currentBomb);
  const currentModule = useRoundStore((state) => state.currentModule);
  const clearModule = useRoundStore((state) => state.clearModule);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const pathname = location.pathname;
  const isHome = pathname === "/";
  const isRounds = pathname === "/rounds";
  const isRoundSetup = /^\/round\/[^/]+\/setup$/.test(pathname);
  const isSolving = pathname.startsWith("/solve");

  const breadcrumbSegments = (() => {
    if (isHome) return null;
    if (isRounds) {
      return [
        { label: "Home", to: "/" },
        { label: "Previous rounds", current: true as const },
      ];
    }
    if (isRoundSetup && roundId) {
      return [
        { label: formatRoundLabel(roundId), to: `/round/${roundId}/setup` },
        { label: "Setup", current: true as const },
      ];
    }
    if (isSolving && roundId) {
      const goToModuleList = () => {
        clearModule();
        setMobileOpen(false);
      };
      const currentModuleLabel = currentModule
        ? formatModuleDisplayName(currentModule.moduleType, currentModule.id)
        : "";
      return [
        { label: formatRoundLabel(roundId), to: `/round/${roundId}/setup` },
        ...(currentModule
          ? [
              { label: "Modules", onClick: goToModuleList },
              { label: currentModuleLabel, current: true as const },
            ]
          : [{ label: "Modules", current: true as const }]),
      ];
    }
    return null;
  })();

  return (
    <nav
      className="sticky top-0 z-40 bg-white border-b-2 border-base-content"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: logo */}
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" aria-label="KTANE Solver home" className="shrink-0">
              <span className="font-display text-2xl font-bold uppercase tracking-tight text-base-content">
                KTANE<span className="text-primary">·</span>SOLVER
              </span>
            </Link>

            {/* Desktop: breadcrumb */}
            <div className="hidden sm:flex items-center gap-1 min-w-0">
              {breadcrumbSegments ? (
                <Breadcrumb segments={breadcrumbSegments} className="truncate" />
              ) : null}
            </div>
          </div>

          {/* Right: strike info + mobile toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {isSolving && currentBomb && (
              <div className="hidden sm:flex items-center gap-2">
                <StrikeIndicator className="text-sm" />
                <StrikeButton className="btn-xs" />
              </div>
            )}

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
          <div className="sm:hidden pb-4 border-t border-base-content/20 mt-2 pt-3 space-y-1">
            {breadcrumbSegments ? (
              <div className="px-3 py-2">
                <Breadcrumb segments={breadcrumbSegments} />
              </div>
            ) : !isHome ? (
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-ink-muted hover:text-ink"
              >
                Home
              </Link>
            ) : null}
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
