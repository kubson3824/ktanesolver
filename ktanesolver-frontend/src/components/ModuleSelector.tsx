import { useState, useEffect, useMemo } from "react";
import { type ModuleCatalogItem, ModuleCategory } from "../types";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert } from "./ui/alert";
import { cn } from "../lib/cn";
import { api } from "../lib/api";
import { useCatalogStore } from "../store/useCatalogStore";

interface ModuleSelectorProps {
  onSelectionChange: (selectedModules: Record<string, number>) => void;
  initialCounts?: Record<string, number>;
}

const categoryLabels: Record<ModuleCategory, string> = {
  [ModuleCategory.VANILLA_REGULAR]: "Vanilla",
  [ModuleCategory.VANILLA_NEEDY]: "Needy",
  [ModuleCategory.MODDED_REGULAR]: "Modded",
  [ModuleCategory.MODDED_NEEDY]: "Modded Needy",
};

const categoryBadgeVariant: Record<ModuleCategory, "primary" | "warning" | "info" | "error"> = {
  [ModuleCategory.VANILLA_REGULAR]: "primary",
  [ModuleCategory.VANILLA_NEEDY]: "warning",
  [ModuleCategory.MODDED_REGULAR]: "info",
  [ModuleCategory.MODDED_NEEDY]: "error",
};

type FilterTab = "ALL" | "VANILLA" | "MODDED" | "NEEDY";

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "ALL" },
  { id: "VANILLA", label: "VANILLA" },
  { id: "MODDED", label: "MODDED" },
  { id: "NEEDY", label: "NEEDY" },
];

function categoryMatchesFilter(category: ModuleCategory, filter: FilterTab): boolean {
  if (filter === "ALL") return true;
  if (filter === "VANILLA") return category === ModuleCategory.VANILLA_REGULAR;
  if (filter === "MODDED") return category === ModuleCategory.MODDED_REGULAR || category === ModuleCategory.MODDED_NEEDY;
  if (filter === "NEEDY") return category === ModuleCategory.VANILLA_NEEDY || category === ModuleCategory.MODDED_NEEDY;
  return true;
}

export default function ModuleSelector({ onSelectionChange, initialCounts = {} }: ModuleSelectorProps) {
  const [modules, setModules] = useState<ModuleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const modules = useCatalogStore((state) => state.catalog);
  const catalogLoaded = useCatalogStore((state) => state.loaded);
  const catalogLoading = useCatalogStore((state) => state.loading);
  const fetchCatalog = useCatalogStore((state) => state.fetchCatalog);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [selectedModules, setSelectedModules] = useState<Record<string, number>>(initialCounts);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "category">("name-asc");

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    api.get<ModuleCatalogItem[]>("/api/modules")
      .then(res => setModules(res.data))
      .catch(() => setFetchError("Failed to load modules. Please try again."))
      .finally(() => setLoading(false));
  }, []);
    if (!catalogLoaded && !catalogLoading) {
      void fetchCatalog();
    }
  }, [catalogLoaded, catalogLoading, fetchCatalog]);

  const filteredModules = useMemo(() => {
    let filtered = modules;

    if (activeFilter !== "ALL") {
      filtered = filtered.filter(m => categoryMatchesFilter(m.category, activeFilter));
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower) ||
        m.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    const recent = filtered.filter(m => recentlyUsed.includes(m.id));
    const others = filtered.filter(m => !recentlyUsed.includes(m.id));

    const sortFunction = (a: ModuleCatalogItem, b: ModuleCatalogItem) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "category") {
        const categoryOrder = [
          ModuleCategory.VANILLA_REGULAR,
          ModuleCategory.VANILLA_NEEDY,
          ModuleCategory.MODDED_REGULAR,
          ModuleCategory.MODDED_NEEDY,
        ];
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.name.localeCompare(b.name);
      }
      return 0;
    };

    return [...[...recent].sort(sortFunction), ...[...others].sort(sortFunction)];
  }, [modules, activeFilter, searchTerm, sortBy, recentlyUsed]);

  const updateModuleCount = (moduleType: string, delta: number) => {
    setSelectedModules(prev => {
      const newCounts = { ...prev };
      newCounts[moduleType] = Math.max(0, (newCounts[moduleType] || 0) + delta);
      return newCounts;
    });
  };

  useEffect(() => {
    onSelectionChange(selectedModules);
  }, [selectedModules, onSelectionChange]);

  const handleModuleClick = (module: ModuleCatalogItem) => {
    setRecentlyUsed(prev => {
      const updated = [module.id, ...prev.filter(id => id !== module.id)];
      return updated.slice(0, 10);
    });
    updateModuleCount(module.type, 1);
  };

  const clearAll = () => {
    setSelectedModules({});
  };

  const totalCount = Object.values(selectedModules).reduce((sum, count) => sum + count, 0);

  if (catalogLoading && modules.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + Sort */}
      <div className="flex gap-2 items-center">
        <Input
          type="text"
          placeholder="Search modules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          className="bg-white border border-base-300 rounded-sm px-2 py-2 text-sm text-base-content focus:outline-none focus:border-primary transition-colors"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name-asc" | "name-desc" | "category")}
        >
          <option value="name-asc">Name ↑</option>
          <option value="name-desc">Name ↓</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors",
              activeFilter === tab.id
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content hover:bg-base-300"
            )}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selected summary */}
      {totalCount > 0 && (
        <div className="bg-white border border-base-300 rounded-sm p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-base-content">
              Selected: {totalCount} module{totalCount !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              className="text-xs text-ink-muted hover:text-base-content transition-colors"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(selectedModules).filter(([, count]) => count > 0).map(([type, count]) => (
              <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-base-200 border border-base-300 rounded-sm text-base-content">
                {type.replace(/_/g, " ")} × {count}
                <button
                  type="button"
                  className="text-ink-muted hover:text-base-content ml-0.5 leading-none"
                  onClick={() => updateModuleCount(type, -count)}
                  aria-label={`Remove ${type}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <Alert variant="error">{fetchError}</Alert>
      )}

      {/* Module grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
        {filteredModules.length === 0 ? (
          <div className="col-span-full text-center py-8 text-ink-muted text-sm">
            No modules found.
          </div>
        ) : (
          filteredModules.map(module => {
            const count = selectedModules[module.type] || 0;
            const isSelected = count > 0;

            return (
              <div
                key={module.id}
                className={cn(
                  "bg-white border border-base-300 rounded-sm p-2 cursor-pointer transition-colors",
                  "hover:border-primary hover:shadow-sm",
                  isSelected && "border-primary bg-primary/5"
                )}
                onClick={() => handleModuleClick(module)}
              >
                <p className="text-sm font-medium text-base-content leading-tight mb-1">{module.name}</p>
                <Badge variant={categoryBadgeVariant[module.category]} className="text-xs">
                  {categoryLabels[module.category]}
                </Badge>

                {isSelected && (
                  <div
                    className="flex items-center gap-1 mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="h-5 w-5 flex items-center justify-center bg-white border border-base-300 rounded-sm text-xs text-ink-muted hover:bg-base-200 hover:text-base-content transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateModuleCount(module.type, -1);
                      }}
                      aria-label="Decrease count"
                    >
                      −
                    </button>
                    <span className="min-w-[1.5rem] text-center text-xs font-mono font-medium text-base-content">
                      {count}
                    </span>
                    <button
                      type="button"
                      className="h-5 w-5 flex items-center justify-center bg-white border border-base-300 rounded-sm text-xs text-ink-muted hover:bg-base-200 hover:text-base-content transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateModuleCount(module.type, 1);
                      }}
                      aria-label="Increase count"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
