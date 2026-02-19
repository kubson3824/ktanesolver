import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRoundStore } from "../store/useRoundStore";
import { type ModuleEntity, type ModuleCatalogItem, ModuleType } from "../types";
import { getLazySolver } from "../components/solvers/registry";
import NeedyModulesPanel from "../components/NeedyModulesPanel";
import PageContainer from "../components/layout/PageContainer";
import ModuleGrid from "../features/solve/ModuleGrid";
import ManualPanel from "../features/solve/ManualPanel";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcut";
import { formatModuleDisplayName } from "../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const REFRESH_EVENT_TYPES = [
  "MODULE_SOLVED",
  "ROUND_STRIKE",
  "MODULE_STRIKE",
  "ROUND_UPDATED",
] as const;

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
  const [isNeedyPanelOpen, setIsNeedyPanelOpen] = useState(false);
  const [moduleCatalog, setModuleCatalog] = useState<ModuleCatalogItem[]>([]);
  const [showFmnReminder, setShowFmnReminder] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCatalog = async () => {
      try {
        const response = await fetch("/api/modules");
        const data = await response.json();
        if (!cancelled) setModuleCatalog(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setModuleCatalog([]);
      }
    };
    void fetchCatalog();
    return () => { cancelled = true; };
  }, []);

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
  const onModuleSolvedRef = useRef<() => void>(() => {});
  onModuleSolvedRef.current = () => {
    const state = useRoundStore.getState();
    const r = state.round;
    if (!r) return;
    const hasUnsolvedFmn = r.bombs.some((b) =>
      b.modules.some((m) => m.type === ModuleType.FORGET_ME_NOT && !(m as ModuleEntity).solved)
    );
    if (hasUnsolvedFmn) setShowFmnReminder(true);
  };

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
              onModuleSolvedRef.current();
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
  }, [roundId, refreshRound]);

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
      if (["VENTING_GAS", "CAPACITOR_DISCHARGE", "KNOBS"].includes(m.type)) {
        needy.push(m);
      } else {
        regular.push(m);
      }
    });
    return { regularModules: regular, needyModules: needy };
  }, [modules]);

  const checkFirstModules = useMemo(() => {
    if (!currentBomb || !regularModules.length) return [];
    return regularModules.filter((m) => catalogByType[m.type]?.checkFirst);
  }, [currentBomb, regularModules, catalogByType]);

  const SolverComponent = useMemo(() => {
    if (!currentModule?.moduleType) return null;
    return getLazySolver(currentModule.moduleType as ModuleType);
  }, [currentModule?.moduleType]);

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
        <Card className="border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
          <CardContent className="text-center pt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-300 mb-4" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-body text-base-content/70 mb-2">No round selected.</p>
            <p className="text-caption text-base-content/60 mb-6">Return to setup to create or choose a round.</p>
            <button className="btn btn-primary" onClick={() => navigate(roundId ? `/round/${roundId}/setup` : "/")}>
              Back to setup
            </button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="grid gap-5">
        {/* Header */}
        <Card className="animate-fade-in border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex flex-row flex-wrap justify-between items-start gap-4">
              <div className="min-w-0">
                <p className="text-sm text-secondary font-medium uppercase tracking-wider">Round #{round?.id?.slice(0, 8)}</p>
                <h1 className="text-page-title mt-2 mb-2">Live defusal</h1>
                <p className="text-caption text-base-content/70 mb-2">
                  Pick the module you&apos;re defusing, study the manual on the left, drive the solver on the right.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn btn-outline btn-sm" onClick={() => void handleRefresh()}>
                  Refresh
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main content */}
        <div className="grid gap-5">
          <div className="min-w-0">
            {!currentModule ? (
              <>
                {error && (
                  <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-warning text-sm mb-5" role="alert">
                    {error}
                  </div>
                )}
                {showFmnReminder && (() => {
                  const fmn = round?.bombs.flatMap((b) =>
                    b.modules
                      .filter((m) => m.type === ModuleType.FORGET_ME_NOT && !(m as ModuleEntity).solved)
                      .map((m) => ({ bombId: b.id, module: m as ModuleEntity }))
                  )[0];
                  if (!fmn) return null;
                  return (
                    <Card className="animate-fade-in border-warning/40 bg-warning/5 backdrop-blur-xl shadow-sm mb-5">
                      <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-body text-base-content/90">
                          Do Forget Me Not stage — a module was just solved.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
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
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowFmnReminder(false)}
                          >
                            Dismiss
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
                {checkFirstModules.length > 0 && (
                  <Card className="animate-fade-in border-warning/40 bg-warning/5 backdrop-blur-xl shadow-sm mb-5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-section-title text-warning">Check these first</CardTitle>
                      <p className="text-caption text-base-content/70 mt-1">
                        These modules need attention early: note info or enter data as the round progresses.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2" role="list">
                        {checkFirstModules.map((module) => {
                          const displayName = formatModuleDisplayName(module.type, module.id);
                          const hint =
                            module.type === "TURN_THE_KEY"
                              ? "Note the time on the display and open the solver."
                              : module.type === "FORGET_ME_NOT"
                                ? "Enter each digit as it appears."
                                : null;
                          return (
                            <li
                              key={module.id}
                              className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-base-200/80 hover:bg-base-200 cursor-pointer"
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
                              <span className="font-medium">{displayName}</span>
                              {hint && <span className="text-caption text-base-content/60">— {hint}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                <ModuleGrid
                  bombs={round?.bombs ?? []}
                  currentBomb={currentBomb}
                  regularModules={regularModules}
                  onSelectBomb={selectBomb}
                  onSelectModule={handleModuleClick}
                  openingModuleId={openingModuleId}
                />
              </>
            ) : (
              <Card className="border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-2">
                  <div>
                    <p className="text-sm text-secondary font-medium uppercase tracking-wider">
                      Currently solving
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <CardTitle className="text-section-title">
                        {formatModuleDisplayName(currentModule.moduleType, currentModule.id)}
                      </CardTitle>
                      <Badge variant="outline" className="text-caption">
                        {currentBomb?.serialNumber ?? "Unknown serial"}
                      </Badge>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm shrink-0" onClick={handleBack}>
                    Back to modules
                  </button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <ManualPanel
                      manualUrl={manualUrl}
                      moduleType={currentModule.moduleType}
                    />

                    <Card className="h-full flex flex-col border-panel-border bg-base-200/90 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-card-title">Solver</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1 min-h-0">
                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center py-12 gap-2">
                              <span className="loading loading-spinner loading-md text-primary"></span>
                              <span className="text-body text-base-content/70">Loading solver...</span>
                            </div>
                          }
                        >
                          {SolverComponent ? (
                            <SolverComponent bomb={currentBomb} />
                          ) : (
                            <div className="text-center py-12">
                              <p className="text-body text-base-content/70 mb-2">Coming soon</p>
                              <p className="text-caption text-base-content/60 mb-6">
                                No solver available for this module type yet.
                              </p>
                              <button className="btn btn-outline" onClick={handleBack}>
                                Back
                              </button>
                            </div>
                          )}
                        </Suspense>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center z-50" aria-live="polite" aria-busy="true">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-panel-border bg-panel-bg/90 backdrop-blur-xl px-8 py-6 shadow-lg">
            <span className="loading loading-spinner loading-lg text-primary" aria-hidden></span>
            <p className="text-body font-medium text-base-content">Syncing round...</p>
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
