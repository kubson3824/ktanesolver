import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useRoundStore } from "../../store/useRoundStore";
import { StrikeIndicator } from "../StrikeIndicator";
import { StrikeButton } from "../StrikeButton";
import Breadcrumb from "./Breadcrumb";
import { formatRoundLabel, formatModuleDisplayName } from "../../lib/utils";
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from "../../lib/cn";

export default function Navbar() {
  const location = useLocation();
  const { roundId } = useParams();
  const currentBomb = useRoundStore((state) => state.currentBomb);
  const currentModule = useRoundStore((state) => state.currentModule);
  const clearModule = useRoundStore((state) => state.clearModule);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

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
      className="sticky top-0 z-40 bg-background border-b border-border"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" aria-label="KTANE Solver home" className="shrink-0">
              <span className="font-bold text-lg text-foreground tracking-tight">
                KTANE<span className="text-accent">·</span>SOLVER
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1 min-w-0">
              {breadcrumbSegments && (
                <Breadcrumb segments={breadcrumbSegments} className="truncate" />
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isSolving && currentBomb && (
              <div className="hidden sm:flex items-center gap-2">
                <StrikeIndicator className="text-sm" />
                <StrikeButton />
              </div>
            )}

            <button
              className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground",
                "hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              onClick={toggleTheme}
              aria-label={isDark ? 'Enable light mode' : 'Enable dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              className={cn(
                "sm:hidden h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground",
                "hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="sm:hidden pb-3 border-t border-border mt-0 pt-3 space-y-1">
            {breadcrumbSegments ? (
              <div className="px-2 py-1">
                <Breadcrumb segments={breadcrumbSegments} />
              </div>
            ) : !isHome ? (
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Home
              </Link>
            ) : null}
            {isSolving && currentBomb && (
              <div className="flex items-center gap-2 px-2 py-2">
                <StrikeIndicator className="text-sm" />
                <StrikeButton />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
