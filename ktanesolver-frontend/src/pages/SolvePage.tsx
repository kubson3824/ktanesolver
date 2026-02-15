import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import type { ModuleEntity, ModuleType } from "../types";
import { getLazySolver } from "../components/solvers/registry";
import NeedyModulesPanel from "../components/NeedyModulesPanel";
import PageContainer from "../components/layout/PageContainer";
import ModuleGrid from "../features/solve/ModuleGrid";
import ManualPanel from "../features/solve/ManualPanel";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcut";
import { formatModuleName } from "../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

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
  const [isNeedyPanelOpen, setIsNeedyPanelOpen] = useState(false);

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

  useEffect(() => {
    if (!currentBomb && round?.bombs.length) {
      selectBomb(round.bombs[0].id);
    }
  }, [round, currentBomb, selectBomb]);

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

  const SolverComponent = useMemo(() => {
    if (!currentModule?.moduleType) return null;
    return getLazySolver(currentModule.moduleType as ModuleType);
  }, [currentModule?.moduleType]);

  const handleModuleClick = (module: ModuleEntity) => {
    if (!currentBomb) return;
    selectModuleById(currentBomb.id, module.id);
  };

  const handleBack = useCallback(() => clearModule(), [clearModule]);

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
            <button className="btn btn-primary" onClick={() => navigate("/setup")}>
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

        {/* Module grid or active solver */}
        {!currentModule ? (
          <ModuleGrid
            bombs={round?.bombs ?? []}
            currentBomb={currentBomb}
            regularModules={regularModules}
            onSelectBomb={selectBomb}
            onSelectModule={handleModuleClick}
          />
        ) : (
          <Card className="border-panel-border bg-panel-bg/80 backdrop-blur-xl shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-2">
              <div>
                <p className="text-sm text-secondary font-medium uppercase tracking-wider">
                  Currently solving
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <CardTitle className="text-section-title">
                    {formatModuleName(currentModule.moduleType)}
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
