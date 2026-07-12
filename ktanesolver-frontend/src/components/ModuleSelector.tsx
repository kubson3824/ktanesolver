import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { type ModuleCatalogItem, ModuleCategory } from "../types";
import { Input } from "./ui/input";
import { Alert } from "./ui/alert";
import { cn } from "../lib/cn";
import { useCatalogStore } from "../store/useCatalogStore";

interface ModuleSelectorProps {
  onSelectionChange: (selectedModules: Record<string, number>) => void;
  initialCounts?: Record<string, number>;
}

type FilterTab = "ALL" | "VANILLA" | "MODDED" | "NEEDY";
type SortOrder = "name-asc" | "name-desc";

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "VANILLA", label: "Vanilla" },
  { id: "MODDED", label: "Modded" },
  { id: "NEEDY", label: "Needy" },
];

const CHIP_COLLAPSE_LIMIT = 6;

const isNeedy = (category: ModuleCategory) =>
  category === ModuleCategory.VANILLA_NEEDY || category === ModuleCategory.MODDED_NEEDY;

const isVanilla = (category: ModuleCategory) =>
  category === ModuleCategory.VANILLA_REGULAR || category === ModuleCategory.VANILLA_NEEDY;

function categoryMatchesFilter(category: ModuleCategory, filter: FilterTab): boolean {
  if (filter === "VANILLA") return isVanilla(category) && !isNeedy(category);
  if (filter === "MODDED") return !isVanilla(category);
  if (filter === "NEEDY") return isNeedy(category);
  return true;
}

export default function ModuleSelector({ onSelectionChange, initialCounts = {} }: ModuleSelectorProps) {
  const modules = useCatalogStore((state) => state.catalog);
  const catalogLoaded = useCatalogStore((state) => state.loaded);
  const catalogLoading = useCatalogStore((state) => state.loading);
  const catalogError = useCatalogStore((state) => state.error);
  const fetchCatalog = useCatalogStore((state) => state.fetchCatalog);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [sortBy, setSortBy] = useState<SortOrder>("name-asc");
  const [selectedModules, setSelectedModules] = useState<Record<string, number>>(initialCounts);
  const [chipsExpanded, setChipsExpanded] = useState(false);

  useEffect(() => {
    if (!catalogLoaded && !catalogLoading) {
      void fetchCatalog();
    }
  }, [catalogLoaded, catalogLoading, fetchCatalog]);

  useEffect(() => {
    onSelectionChange(selectedModules);
  }, [selectedModules, onSelectionChange]);

  const nameByType = useMemo(
    () => Object.fromEntries(modules.map((m) => [m.type, m.name])),
    [modules],
  );

  const filteredModules = useMemo(() => {
    let filtered = modules;
    if (activeFilter !== "ALL") {
      filtered = filtered.filter((m) => categoryMatchesFilter(m.category, activeFilter));
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((m) => m.name.toLowerCase().includes(q));
    }
    return [...filtered].sort((a, b) =>
      sortBy === "name-asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }, [modules, activeFilter, searchTerm, sortBy]);

  const setModuleCount = (moduleType: string, count: number) => {
    setSelectedModules((prev) => ({ ...prev, [moduleType]: Math.max(0, count) }));
  };

  const handleCardClick = (module: ModuleCatalogItem) => {
    const current = selectedModules[module.type] || 0;
    setModuleCount(module.type, current > 0 ? 0 : 1);
  };

  const clearAll = () => {
    setSelectedModules({});
    setChipsExpanded(false);
  };

  const chips = Object.entries(selectedModules)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      type,
      label: `${nameByType[type] ?? type.replace(/_/g, " ")} × ${count}`,
    }));
  const totalCount = Object.values(selectedModules).reduce((sum, count) => sum + count, 0);
  const hasChipOverflow = chips.length > CHIP_COLLAPSE_LIMIT;
  const visibleChips = chipsExpanded || !hasChipOverflow ? chips : chips.slice(0, CHIP_COLLAPSE_LIMIT);

  if (catalogLoading && modules.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + sort row */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Search modules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[140px] h-10 rounded-lg px-2.5 text-sm"
        />
        <select
          className="h-10 rounded-lg border border-border bg-background px-2 text-[13px] text-foreground focus:outline-none focus:border-primary transition-colors"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOrder)}
        >
          <option value="name-asc">Name ↑</option>
          <option value="name-desc">Name ↓</option>
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "h-[34px] px-3.5 text-[11px] font-semibold uppercase tracking-[0.04em] rounded-lg transition-colors",
              activeFilter === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/70",
            )}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selected-modules tray */}
      {totalCount > 0 && (
        <div className="border border-border rounded-lg bg-card px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-foreground">
              Selected: {totalCount} module{totalCount !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              {hasChipOverflow && chipsExpanded && (
                <button
                  type="button"
                  className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setChipsExpanded(false)}
                >
                  Show less
                </button>
              )}
              <button
                type="button"
                className="h-7 px-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={clearAll}
              >
                Clear all
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {visibleChips.map((chip) => (
              <span
                key={chip.type}
                className="inline-flex items-center gap-1 py-1 pl-2.5 pr-1.5 text-xs text-foreground border border-border rounded-full bg-muted"
              >
                {chip.label}
                <button
                  type="button"
                  className="h-[22px] w-[22px] text-[13px] leading-none text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setModuleCount(chip.type, 0)}
                  aria-label={`Remove ${chip.label}`}
                >
                  ×
                </button>
              </span>
            ))}
            {hasChipOverflow && !chipsExpanded && (
              <button
                type="button"
                className="px-3 py-1 text-xs font-semibold border border-dashed border-border rounded-full text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setChipsExpanded(true)}
              >
                +{chips.length - CHIP_COLLAPSE_LIMIT} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fetch error */}
      {catalogError && <Alert variant="error">{catalogError}</Alert>}

      {/* Module grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
        {filteredModules.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
            No modules found.
          </div>
        ) : (
          filteredModules.map((module) => {
            const count = selectedModules[module.type] || 0;
            const isSelected = count > 0;
            const needy = isNeedy(module.category);

            return (
              <div
                key={module.id}
                className={cn(
                  "rounded-lg border p-2.5 cursor-pointer transition-colors",
                  isSelected
                    ? "border-accent bg-[rgba(62,207,142,0.08)]"
                    : "border-border bg-card hover:border-primary",
                )}
                onClick={() => handleCardClick(module)}
              >
                <p className="text-[13px] font-medium text-foreground leading-[1.3] mb-1">
                  {module.name}
                </p>
                <span
                  className={cn(
                    "inline-block text-[10px] px-[7px] py-px rounded-full",
                    needy
                      ? "bg-[#F2DFB3] text-[#7A4A12]"
                      : "bg-[rgba(90,150,220,0.18)] text-[#3D6FB0]",
                  )}
                >
                  {needy ? "Needy" : "Regular"}
                </span>

                {/* invisible (not unmounted) so card heights stay uniform per design */}
                <div
                  className={cn("flex items-center gap-2 mt-2", !isSelected && "invisible")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-border bg-background text-foreground text-base font-bold leading-none hover:bg-muted transition-colors"
                    onClick={() => setModuleCount(module.type, count - 1)}
                    aria-label={`Decrease ${module.name} count`}
                  >
                    −
                  </button>
                  <span className="min-w-[20px] text-center text-[13px] font-mono text-foreground">
                    {count}
                  </span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-border bg-background text-foreground text-base font-bold leading-none hover:bg-muted transition-colors"
                    onClick={() => setModuleCount(module.type, count + 1)}
                    aria-label={`Increase ${module.name} count`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
