import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import type {ModuleEntity} from "../types";

const formatModuleName = (type: string) =>
  type
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
    .join(" ");

export default function SolvePage() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const round = useRoundStore((state) => state.round);
  const fetchRound = useRoundStore((state) => state.fetchRound);
  const loading = useRoundStore((state) => state.loading);
  const currentBomb = useRoundStore((state) => state.currentBomb);
  const currentModule = useRoundStore((state) => state.currentModule);
  const selectBomb = useRoundStore((state) => state.selectBomb);
  const selectModule = useRoundStore((state) => state.selectModule);
  const clearModule = useRoundStore((state) => state.clearModule);
  const manualUrl = useRoundStore((state) => state.manualUrl);

  useEffect(() => {
    if (roundId && round?.id !== roundId) {
      void fetchRound(roundId);
    }
  }, [roundId, round?.id, fetchRound]);

  useEffect(() => {
    if (!currentBomb && round?.bombs.length) {
      selectBomb(round.bombs[0].id);
    }
  }, [round, currentBomb, selectBomb]);

  const modules: ModuleEntity[] = useMemo(() => {
    if (!currentBomb) return [];
    return currentBomb.modules ?? [];
  }, [currentBomb]);

  const handleModuleClick = (module: ModuleEntity) => {
    if (!currentBomb) return;
    selectModule(currentBomb.id, module.type);
  };

  const handleBack = () => {
    clearModule();
  };

  if (!roundId) {
    return (
      <div className="app-shell">
        <div className="shell-content">
          <div className="panel empty-state">
            <p>No round selected. Return to setup.</p>
            <button className="action-primary" onClick={() => navigate("/setup")}>
              Back to setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="shell-content grid">
        <header className="panel solve-header">
          <div>
            <p className="eyebrow">Round #{round?.id?.slice(0, 8)}</p>
            <h1>Live defusal</h1>
            <p className="hero-subtitle">
              Tabs for each bomb below. Pick the module you&apos;re defusing,
              study the binder on the left, drive the solver on the right.
            </p>
          </div>
          <button className="ghost-button" onClick={() => navigate("/setup")}>
            Back to bomb list
          </button>
        </header>

        {!currentModule ? (
          <section className="panel solve-stage">
            <div className="bomb-tabs">
              {round?.bombs.map((bomb) => (
                <button
                  key={bomb.id}
                  className={`bomb-tab ${
                    currentBomb?.id === bomb.id ? "active" : ""
                  }`}
                  onClick={() => selectBomb(bomb.id)}
                >
                  <span>{bomb.serialNumber || "Unknown serial"}</span>
                  <small>{bomb.modules.length} modules</small>
                </button>
              ))}
            </div>

            <div className="modules-grid">
              {modules.length === 0 && (
                <div className="empty-state">No modules assigned to this bomb.</div>
              )}
              {modules.map((module) => (
                <article key={module.id} className="module-card interactive">
                  <header>
                    <h3>{formatModuleName(module.type)}</h3>
                    <span
                      className={`tag ${module.solved ? "tag-success" : "tag-warning"}`}
                    >
                      {module.solved ? "Solved" : "Awaiting"}
                    </span>
                  </header>
                  <p className="module-note">
                    {module.solved
                      ? "This module has already been cleared."
                      : "Tap to open the live solving cockpit."}
                  </p>
                  <button
                    className="action-primary"
                    onClick={() => handleModuleClick(module)}
                    disabled={module.solved}
                  >
                    {module.solved ? "Solved" : "Solve module"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="panel module-detail">
            <header className="panel-header">
              <div>
                <p className="eyebrow">Currently solving</p>
                <h2>
                  {formatModuleName(currentModule.moduleType)}
                  <span className="tag highlight">
                    {currentBomb?.serialNumber ?? "Unknown serial"}
                  </span>
                </h2>
              </div>
              <button className="ghost-button" onClick={handleBack}>
                Back to modules
              </button>
            </header>
            <div className="solve-grid">
              <div className="manual-pane">
                {manualUrl ? (
                  <iframe
                    src={manualUrl}
                    title={`${currentModule.moduleType} manual`}
                  />
                ) : (
                  <div className="empty-state">Manual loading...</div>
                )}
              </div>
              <div className="solver-pane">
                <div className="solver-placeholder">
                  <p className="eyebrow">Solver UI</p>
                  <h3>Coming soon</h3>
                  <p>
                    This is where module-specific solver components will live. Hook
                    up forms, logic helpers, or real-time instructions while
                    referencing the manual.
                  </p>
                  <div className="solver-actions">
                    <button className="action-primary" disabled>
                      Submit
                    </button>
                    <button className="ghost-button" onClick={handleBack}>
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Syncing round...</p>
        </div>
      )}
    </div>
  );
}
