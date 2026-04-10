import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRoundStore } from "../store/useRoundStore";
import { type BombEntity, type ModuleEntity, type ModuleCatalogItem, ModuleType } from "../types";
import { isNeedyModuleType, lazySolverRegistry } from "../components/solvers/registry";
import { useCatalogStore } from "../store/useCatalogStore";
import NeedyModulesPanel from "../components/NeedyModulesPanel";
import PageContainer from "../components/layout/PageContainer";
import ModuleGrid from "../features/solve/ModuleGrid";
import ManualPanel from "../features/solve/ManualPanel";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcut";
import { formatModuleName } from "../lib/utils";
import { Skeleton } from "../components/ui/skeleton";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const REFRESH_EVENT_TYPES = [
  "MODULE_SOLVED",
  "ROUND_STRIKE",
  "MODULE_STRIKE",
  "ROUND_UPDATED",
] as const;

function SolverContent({
  moduleType,
  bomb,
  onBack,
}: {
  moduleType?: ModuleType;
  bomb: BombEntity | null | undefined;
  onBack: () => void;
}) {
  const SolverComponent = moduleType ? lazySolverRegistry[moduleType] ?? null : null;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 gap-2">
          <span className="loading loading-spinner loading-md text-primary"></span>
          <span className="text-body text-base-content/70">Loading solver...</span>
        </div>
      }
    >
      {SolverComponent ? (
        <SolverComponent bomb={bomb} />
      ) : (
        <div className="text-center py-12">
          <p className="text-body text-base-content/70 mb-2">Coming soon</p>
          <p className="text-caption text-base-content/60 mb-6">
            No solver available for this module type yet.
          </p>
          <button className="btn btn-outline" onClick={onBack}>
            Back
          </button>
        </div>
      )}
    </Suspense>
  );
}

export default function SolvePage() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const round = useRoundStore((state) => state.round);
  const refreshRound = useRoundStore((state) => state.refreshRound);
  const loading = useRoundStore((state) => state.loading);
  const currentBomb = useRoundStore((state) => state.currentBomb);
  const currentModule = useRoundStore((state) => state.currentModule);
  const selectBomb = useRoundStore((state) => state.selectBomb);
  const selectModuleById = useRoundStore((state) => state.selectModuleById);
  const clearModule = useRoundStore((state) => state.clearModule);
  const manualUrl = useRoundStore((state) => state.manualUrl);
  const error = useRoundStore((state) => state.error);
  const openingModuleId = useRoundStore((state) => state.openingModuleId);
  const moduleCatalog = useCatalogStore((state) => state.catalog);
  const catalogLoaded = useCatalogStore((state) => state.loaded);
  const catalogLoading = useCatalogStore((state) => state.loading);
  const fetchCatalog = useCatalogStore((state) => state.fetchCatalog);
  const [isNeedyPanelOpen, setIsNeedyPanelOpen] = useState(false);
  const [showFmnReminder, setShowFmnReminder] = useState(false);

  useEffect(() => {
    if (!catalogLoaded && !catalogLoading) {
      void fetchCatalog();
    }
  }, [catalogLoaded, catalogLoading, fetchCatalog]);

  const catalogByType = useMemo(() => {
    const map: Record<string, ModuleCatalogItem> = {};
    moduleCatalog.forEach((item) => {
      map[item.type] = item;
    });
    return map;
  }, [moduleCatalog]);

  useEffect(() => {
    if (!roundId) return;
    let cancelled = false;

    const sync = async (attempt: number) => {
      try {
        await refreshRound(roundId);
      } catch {
        if (cancelled) return;
        if (attempt >= 1) return;
        window.setTimeout(() => {
          if (cancelled) return;
          void sync(attempt + 1);
        }, 1500);
      }
    };

    void sync(0);
    return () => { cancelled = true; };
  }, [roundId, refreshRound]);

  // WebSocket: refresh round on events; on MODULE_SOLVED, show FMN reminder if round has unsolved Forget Me Not
  const onModuleSolved = useCallback(() => {
    const state = useRoundStore.getState();
    const r = state.round;
    if (!r) return;
    const hasUnsolvedFmn = r.bombs.some((b) =>
      b.modules.some((m) => m.type === ModuleType.FORGET_ME_NOT && !(m as ModuleEntity).solved)
    );
    if (hasUnsolvedFmn) setShowFmnReminder(true);
  }, []);

  useEffect(() => {
    if (!roundId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as unknown as WebSocket,
      connectHeaders: {},
      onConnect: () => {
        client.subscribe(`/topic/rounds/${roundId}`, (message) => {
          try {
            const body = JSON.parse(message.body) as { type: string };
            if (REFRESH_EVENT_TYPES.includes(body.type as (typeof REFRESH_EVENT_TYPES)[number])) {
              void refreshRound(roundId);
            }
            if (body.type === "MODULE_SOLVED") {
              onModuleSolved();
            }
          } catch {
            // ignore parse errors
          }
        });
      },
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [onModuleSolved, roundId, refreshRound]);

  useEffect(() => {
    if (!currentBomb && round?.bombs.length) {
      selectBomb(round.bombs[0].id);
    }
  }, [round, currentBomb, selectBomb]);

  // Hide FMN reminder when user opens Forget Me Not
  useEffect(() => {
    if (currentModule?.moduleType === ModuleType.FORGET_ME_NOT) {
      setShowFmnReminder(false);
    }
  }, [currentModule?.moduleType]);

  const modules: ModuleEntity[] = useMemo(() => {
    if (!currentBomb) return [];
    return currentBomb.modules ?? [];
  }, [currentBomb]);

  const { regularModules, needyModules } = useMemo(() => {
    const regular: ModuleEntity[] = [];
    const needy: ModuleEntity[] = [];
    modules.forEach((m) => {
      if (isNeedyModuleType(m.type, catalogByType)) {
        needy.push(m);
      } else {
        regular.push(m);
      }
    });
    return { regularModules: regular, needyModules: needy };
  }, [modules, catalogByType]);

  const checkFirstModules = useMemo(() => {
    if (!currentBomb || !regularModules.length) return [];
    return regularModules.filter((m) => catalogByType[m.type]?.checkFirst);
  }, [currentBomb, regularModules, catalogByType]);

  const handleModuleClick = (module: ModuleEntity) => {
    if (!currentBomb) return;
    selectModuleById(currentBomb.id, module.id);
  };

  const handleBack = useCallback(() => void clearModule(), [clearModule]);

  // Keyboard shortcuts: Escape to go back to module grid
  useKeyboardShortcuts(
    useMemo(
      () => [
        {
          key: "Escape",
          handler: handleBack,
          enabled: !!currentModule,
        },
      ],
      [handleBack, currentModule]
    )
  );

  const handleRefresh = async () => {
    if (!roundId) return;
    await refreshRound(roundId);
  };

  // --- Early returns ---
  if (!roundId) {
    return (
      <PageContainer>
        <div className="card-manual p-6 text-center">
          <p className="text-sm text-ink-muted mb-2">No round selected.</p>
          <p className="text-xs text-ink-muted mb-4">Return to setup to create or choose a round.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/")}>
            Back to setup
          </button>
        </div>
      </PageContainer>
    );
  }

  // Derived: current module catalog entry
  const currentCatalogEntry = currentModule?.moduleType
    ? catalogByType[currentModule.moduleType]
    : undefined;
  const currentModuleDisplayName = currentModule?.moduleType
    ? (currentCatalogEntry?.name ?? formatModuleName(currentModule.moduleType))
    : "";
  const currentModuleId = currentCatalogEntry?.id ?? "";

  return (
    <PageContainer>
      <div className="grid gap-4">
        {/* Page header */}
        <div className="flex flex-row flex-wrap justify-between items-center gap-3">
          <div>
            <p className="section-heading text-ink-muted">
              Round #{round?.id?.slice(0, 8)}
            </p>
            <h1 className="page-title mt-1">Live defusal</h1>
          </div>
          <div className="flex gap-2 items-center">
            {currentModule && (
              <button className="btn btn-outline btn-sm" onClick={handleBack}>
                ← Back to modules
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => void handleRefresh()}>
              Refresh
            </button>
          </div>
        </div>

        <div className="section-divider" />

        {/* Main content */}
        {!currentModule ? (
          <div className="grid gap-4">
            {error && (
              <div className="callout callout-error" role="alert">
                {error}
              </div>
            )}

            {/* Forget Me Not reminder */}
            {showFmnReminder && (() => {
              const fmn = round?.bombs.flatMap((b) =>
                b.modules
                  .filter((m) => m.type === ModuleType.FORGET_ME_NOT && !(m as ModuleEntity).solved)
                  .map((m) => ({ bombId: b.id, module: m as ModuleEntity }))
              )[0];
              if (!fmn) return null;
              return (
                <div className="callout callout-warning flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">
                    Do Forget Me Not stage — a module was just solved.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => {
                        selectBomb(fmn.bombId);
                        selectModuleById(fmn.bombId, fmn.module.id);
                        setShowFmnReminder(false);
                      }}
                    >
                      Open Forget Me Not
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setShowFmnReminder(false)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Check These First */}
            {checkFirstModules.length > 0 && (
              <div className="callout callout-warning">
                <p className="font-semibold mb-2">Check These First</p>
                <ul className="space-y-1">
                  {checkFirstModules.map((module) => {
                    const hint =
                      module.type === "TURN_THE_KEY"
                        ? "Note the time on the display and open the solver."
                        : module.type === "FORGET_ME_NOT"
                          ? "Enter each digit as it appears."
                          : null;
                    const name = catalogByType[module.type]?.name ?? formatModuleName(module.type);
                    return (
                      <li
                        key={module.id}
                        className="flex flex-wrap items-center gap-2 cursor-pointer hover:underline"
                        onClick={() => handleModuleClick(module)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleModuleClick(module);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="font-medium">{name}</span>
                        {hint && <span className="text-xs opacity-80">— {hint}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Module grid */}
            <ModuleGrid
              bombs={round?.bombs ?? []}
              currentBomb={currentBomb}
              regularModules={regularModules}
              onSelectBomb={selectBomb}
              onSelectModule={handleModuleClick}
              openingModuleId={openingModuleId}
            />
          </div>
        ) : (
          /* Solver view */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left: ManualPanel */}
            <div className="lg:col-span-3">
              <ManualPanel
                manualUrl={manualUrl}
                moduleType={currentModule.moduleType}
              />
            </div>

            {/* Right: Solver card */}
            <div className="lg:col-span-2">
              <div className="card-manual h-full flex flex-col">
                {/* Card header */}
                <div className="bg-base-200 border-b border-base-300 px-4 py-3">
                  <h2 className="font-display text-lg font-bold uppercase text-base-content leading-tight">
                    {currentModuleDisplayName}
                  </h2>
                  {currentModuleId && (
                    <p className="font-mono text-xs text-ink-muted mt-0.5">
                      {currentModuleId}
                    </p>
                  )}
                </div>

                {/* Card content */}
                <div className="px-4 py-4 flex-1 flex flex-col">
                  <Suspense
                    fallback={
                      <div className="flex flex-col gap-3 py-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-8 w-full mt-2" />
                      </div>
                    }
                  >
                    <SolverContent
                      moduleType={currentModule.moduleType}
                      bomb={currentBomb}
                      onBack={handleBack}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div
          className="fixed inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center z-50"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="card-manual flex flex-col items-center gap-4 px-8 py-6">
            <span className="loading loading-spinner loading-lg text-primary" aria-hidden />
            <p className="text-sm font-medium text-base-content">Syncing round...</p>
          </div>
        </div>
      )}

      {/* Needy Modules Panel */}
      <NeedyModulesPanel
        needyModules={needyModules}
        bomb={currentBomb}
        roundId={roundId || ""}
        bombId={currentBomb?.id || ""}
        isOpen={isNeedyPanelOpen}
        onToggle={() => setIsNeedyPanelOpen(!isNeedyPanelOpen)}
      />
    </PageContainer>
  );
}
