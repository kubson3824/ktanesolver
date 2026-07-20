import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
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
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import ModuleNumberInput from "../components/ModuleNumberInput";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const REFRESH_EVENT_TYPES = [
  "MODULE_UPDATED",
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
  moduleType?: string;
  bomb: BombEntity | null | undefined;
  onBack: () => void;
}) {
  const SolverComponent = moduleType ? lazySolverRegistry[moduleType] ?? null : null;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm text-muted-foreground">Loading solver...</span>
        </div>
      }
    >
      {SolverComponent ? (
        <SolverComponent bomb={bomb} />
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-2">Coming soon</p>
          <p className="text-xs text-muted-foreground mb-6">
            No solver available for this module type yet.
          </p>
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
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
  const resetModule = useRoundStore((state) => state.resetModule);
  const completeModule = useRoundStore((state) => state.completeModule);
  const manualUrl = useRoundStore((state) => state.manualUrl);
  const error = useRoundStore((state) => state.error);
  const openingModuleId = useRoundStore((state) => state.openingModuleId);
  const moduleCatalog = useCatalogStore((state) => state.catalog);
  const catalogLoaded = useCatalogStore((state) => state.loaded);
  const catalogLoading = useCatalogStore((state) => state.loading);
  const fetchCatalog = useCatalogStore((state) => state.fetchCatalog);
  const [isNeedyPanelOpen, setIsNeedyPanelOpen] = useState(false);
  const [showFmnReminder, setShowFmnReminder] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false);
  const [undoError, setUndoError] = useState("");
  // Manual/solver split: draggable divider, % width of the manual panel on lg screens.
  const [manualPct, setManualPct] = useState(() => {
    const stored = Number(localStorage.getItem("solve-manual-pct"));
    return stored >= 25 && stored <= 75 ? stored : 60;
  });
  const splitRef = useRef<HTMLDivElement>(null);
  const splitDragging = useRef(false);
  const onSplitDown = (e: React.PointerEvent<HTMLDivElement>) => {
    splitDragging.current = true;
    // Capture so the drag keeps working while the pointer crosses the manual iframe.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* synthetic events have no active pointer */ }
  };
  const onSplitMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!splitDragging.current || !(e.buttons & 1) || !splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const pct = Math.min(75, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100));
    setManualPct(pct);
    localStorage.setItem("solve-manual-pct", String(Math.round(pct)));
  };

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
    if (module.type === ModuleType.FORGET_ME_NOT) {
      setShowFmnReminder(false);
    }
    selectModuleById(currentBomb.id, module.id);
  };

  const handleBack = useCallback(() => void clearModule(), [clearModule]);

  const handleUndoSolve = async () => {
    if (!currentBomb || !currentModule) return;
    setUndoError("");
    try {
      await resetModule(currentBomb.id, currentModule.id);
      setIsUndoDialogOpen(false);
      clearModule();
    } catch (cause) {
      setUndoError(cause instanceof Error ? cause.message : "Could not undo solve");
    }
  };

  const handleCompleteModule = async () => {
    if (!currentBomb || !currentModule) return;
    setCompletionError("");
    setIsCompleting(true);
    try {
      await completeModule(currentBomb.id, currentModule.id);
      setIsCompleteDialogOpen(false);
    } catch (cause) {
      setCompletionError(cause instanceof Error ? cause.message : "Could not mark module solved");
    } finally {
      setIsCompleting(false);
    }
  };

  // Keyboard shortcuts: Escape to go back to module grid
  useKeyboardShortcuts(
    useMemo(
      () => [
        {
          key: "Escape",
          handler: handleBack,
          enabled: !!currentModule && !isCompleteDialogOpen && !isUndoDialogOpen,
        },
      ],
      [handleBack, currentModule, isCompleteDialogOpen, isUndoDialogOpen]
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
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">No round selected.</p>
          <p className="text-xs text-muted-foreground mb-4">Return to setup to create or choose a round.</p>
          <Button variant="default" size="sm" onClick={() => navigate("/")}>
            Back to setup
          </Button>
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
  const shouldShowFmnReminder =
    showFmnReminder && currentModule?.moduleType !== ModuleType.FORGET_ME_NOT;

  return (
    <PageContainer>
      <div className="grid gap-4">
        {/* Page header */}
        <div className="flex flex-row flex-wrap justify-between items-center gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Round #{round?.id?.slice(0, 8)}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">Live defusal</h1>
          </div>
          <div className="flex gap-2 items-center">
            {currentModule && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                ← Back to modules
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void handleRefresh()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="border-b border-border" />

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main content */}
        {!currentModule ? (
          <div className="grid gap-4">
            {/* Forget Me Not reminder */}
            {shouldShowFmnReminder && (() => {
              const fmn = round?.bombs.flatMap((b) =>
                b.modules
                  .filter((m) => m.type === ModuleType.FORGET_ME_NOT && !(m as ModuleEntity).solved)
                  .map((m) => ({ bombId: b.id, module: m as ModuleEntity }))
              )[0];
              if (!fmn) return null;
              return (
                <Alert variant="warning" className="flex flex-wrap items-center justify-between gap-3">
                  <AlertDescription className="font-semibold">
                    Do Forget Me Not stage — a module was just solved.
                  </AlertDescription>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectBomb(fmn.bombId);
                        selectModuleById(fmn.bombId, fmn.module.id);
                        setShowFmnReminder(false);
                      }}
                    >
                      Open Forget Me Not
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFmnReminder(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </Alert>
              );
            })()}

            {/* Check These First */}
            {checkFirstModules.length > 0 && (
              <Alert variant="warning">
                <AlertDescription>
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
                </AlertDescription>
              </Alert>
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
          <div ref={splitRef} className="flex flex-col gap-4 lg:flex-row lg:gap-0">
            {/* Left: ManualPanel */}
            <div className="min-w-0 lg:shrink-0" style={{ flexBasis: `${manualPct}%` }}>
              <ManualPanel
                manualUrl={manualUrl}
                moduleType={currentModule.moduleType}
              />
            </div>

            {/* Divider: drag to resize both panels */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize manual and solver panels"
              className="group hidden w-4 shrink-0 cursor-col-resize touch-none lg:block"
              onPointerDown={onSplitDown}
              onPointerMove={onSplitMove}
              onPointerUp={() => { splitDragging.current = false; }}
              onLostPointerCapture={() => { splitDragging.current = false; }}
            >
              <div className="mx-auto h-full w-1 rounded bg-border transition-colors group-hover:bg-accent" />
            </div>

            {/* Right: Solver card */}
            <div className="min-w-0 flex-1">
              <div className="rounded-xl border border-border bg-card shadow-sm h-full flex flex-col">
                {/* Card header */}
                <div className="flex items-center justify-between gap-3 bg-muted/40 border-b border-border px-4 py-3">
                  <div>
                    <h2 className="font-display text-lg font-bold uppercase text-base-content leading-tight">
                      {currentModuleDisplayName}
                    </h2>
                    {currentModuleId && (
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        {currentModuleId}
                      </p>
                    )}
                  </div>
                  {currentModule.solved ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUndoError("");
                        setIsUndoDialogOpen(true);
                      }}
                    >
                      Undo solve
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => {
                        setCompletionError("");
                        setIsCompleteDialogOpen(true);
                      }}
                    >
                      {Object.keys(currentModule.solution ?? {}).length ? "Confirm solved" : "Mark manually solved"}
                    </Button>
                  )}
                </div>

                <ModuleNumberInput />

                {completionError && (
                  <p className="px-4 pt-3 text-sm text-destructive" role="alert">{completionError}</p>
                )}

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
          className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden bg-transparent"
          aria-live="polite"
          aria-busy="true"
          aria-label="Syncing round"
        >
          <div className="h-full bg-accent animate-progress" />
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

      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="mx-4 w-[calc(100%_-_2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark {currentModuleDisplayName} as solved?</DialogTitle>
            <DialogDescription>
              Confirm that the module has been solved on the bomb.
            </DialogDescription>
          </DialogHeader>
          {completionError && (
            <DialogBody>
              <p className="text-sm text-destructive" role="alert">{completionError}</p>
            </DialogBody>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isCompleting}>Cancel</Button>
            </DialogClose>
            <Button variant="success" loading={isCompleting} onClick={() => void handleCompleteModule()}>
              Mark solved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
        <DialogContent className="mx-4 w-[calc(100%_-_2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Undo solve for {currentModuleDisplayName}?</DialogTitle>
            <DialogDescription>
              This clears the current attempt so you can solve the module again.
            </DialogDescription>
          </DialogHeader>
          {undoError && (
            <DialogBody>
              <p className="text-sm text-destructive" role="alert">{undoError}</p>
            </DialogBody>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button variant="destructive" loading={loading} onClick={() => void handleUndoSolve()}>
              Undo solve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
