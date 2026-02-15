import { useState, useEffect, useMemo } from "react";
import { type ModuleCatalogItem, ModuleCategory } from "../types";

interface ModuleSelectorProps {
  onSelectionChange: (selectedModules: Record<string, number>) => void;
  initialCounts?: Record<string, number>;
}

const categoryLabels = {
  [ModuleCategory.VANILLA_REGULAR]: "Vanilla Regular",
  [ModuleCategory.VANILLA_NEEDY]: "Vanilla Needy",
  [ModuleCategory.MODDED_REGULAR]: "Modded Regular",
  [ModuleCategory.MODDED_NEEDY]: "Modded Needy",
};

const categoryColors = {
  [ModuleCategory.VANILLA_REGULAR]: "badge-primary",
  [ModuleCategory.VANILLA_NEEDY]: "badge-warning",
  [ModuleCategory.MODDED_REGULAR]: "badge-info",
  [ModuleCategory.MODDED_NEEDY]: "badge-error",
};

export default function ModuleSelector({ onSelectionChange, initialCounts = {} }: ModuleSelectorProps) {
  const [modules, setModules] = useState<ModuleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | "ALL">("ALL");
  const [selectedModules, setSelectedModules] = useState<Record<string, number>>(initialCounts);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "category">("name-asc");

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/modules");
      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = useMemo(() => {
    let filtered = modules;

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower) ||
        m.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Separate recently used and others first
    const recent = filtered.filter(m => recentlyUsed.includes(m.id));
    const others = filtered.filter(m => !recentlyUsed.includes(m.id));

    // Apply sorting function
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

    // Sort both groups
    const sortedRecent = [...recent].sort(sortFunction);
    const sortedOthers = [...others].sort(sortFunction);
    
    return [...sortedRecent, ...sortedOthers];
  }, [modules, selectedCategory, searchTerm, sortBy, recentlyUsed]);

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
    // Track recently used
    setRecentlyUsed(prev => {
      const updated = [module.id, ...prev.filter(id => id !== module.id)];
      return updated.slice(0, 10); // Keep only last 10
    });

    // Increment count
    updateModuleCount(module.type, 1);
  };

  const clearAll = () => {
    setSelectedModules({});
  };

  const totalCount = Object.values(selectedModules).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search modules by name, description, or tags..."
            className="input input-bordered flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="select select-bordered w-32"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name-asc" | "name-desc" | "category")}
          >
            <option value="name-asc">Name ↑</option>
            <option value="name-desc">Name ↓</option>
            <option value="category">Category</option>
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn btn-sm ${selectedCategory === "ALL" ? "btn-active" : "btn-outline"}`}
            onClick={() => setSelectedCategory("ALL")}
          >
            All ({modules.length})
          </button>
          {Object.values(ModuleCategory).map(category => (
            <button
              key={category}
              className={`btn btn-sm ${selectedCategory === category ? "btn-active" : "btn-outline"}`}
              onClick={() => setSelectedCategory(category)}
            >
              {categoryLabels[category]} ({modules.filter(m => m.category === category).length})
            </button>
          ))}
        </div>
      </div>

      {/* Selected Modules Summary */}
      {totalCount > 0 && (
        <div className="rounded-lg border border-panel-border bg-base-200/90 p-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Selected: {totalCount} modules</span>
            <button className="btn btn-xs btn-ghost" onClick={clearAll}>
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(selectedModules).filter(([, count]) => count > 0).map(([type, count]) => (
              <span key={type} className="badge badge-info gap-1">
                {type.replace(/_/g, " ")} × {count}
                <button
                  className="btn btn-ghost btn-xs p-0 h-4 min-h-4"
                  onClick={() => updateModuleCount(type, -count)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Module List */}
      <div className="grid gap-2 max-h-96 overflow-y-auto">
        {filteredModules.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            No modules found matching your criteria.
          </div>
        ) : (
          filteredModules.map(module => {
            const count = selectedModules[module.type] || 0;
            const isRecent = recentlyUsed.includes(module.id);
            
            return (
              <div
                key={module.id}
                className={`rounded-lg border border-panel-border bg-base-200/90 cursor-pointer hover:border-primary transition-colors ${
                  isRecent ? "ring-2 ring-primary/20" : ""
                }`}
                onClick={() => handleModuleClick(module)}
              >
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{module.name}</h3>
                        {isRecent && <span className="badge badge-xs badge-primary">Recent</span>}
                        <span className={`badge badge-xs ${categoryColors[module.category]}`}>
                          {categoryLabels[module.category]}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/70 mb-2">{module.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {module.tags.map(tag => (
                          <span key={tag} className="badge badge-outline badge-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {count > 0 && (
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost btn-circle"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateModuleCount(module.type, -1);
                          }}
                        >
                          -
                        </button>
                        <span className="badge badge-info w-8 text-center">{count}</span>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost btn-circle"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateModuleCount(module.type, 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
