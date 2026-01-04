import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import type {ModuleEntity} from "../types";
import WireSolver from "../components/WireSolver";
import ButtonSolver from "../components/ButtonSolver";
import KeypadsSolver from "../components/KeypadsSolver";
import MazeSolver from "../components/MazeSolver";
import MemorySolver from "../components/MemorySolver";
import MorseCodeSolver from "../components/MorseCodeSolver";
import PasswordSolver from "../components/PasswordSolver";
import SimonSolver from "../components/SimonSolver";
import WhosOnFirstSolver from "../components/WhosOnFirstSolver";
import ComplicatedWiresSolver from "../components/ComplicatedWiresSolver";
import WireSequencesSolver from "../components/WireSequencesSolver";
import ColorFlashSolver from "../components/ColorFlashSolver";
import PianoKeysSolver from "../components/PianoKeysSolver";
import SemaphoreSolver from "../components/SemaphoreSolver";
import MathSolver from "../components/MathSolver";
import EmojiSolver from "../components/EmojiSolver";
import SwitchesSolver from "../components/SwitchesSolver";
import { StrikeButton } from "../components/StrikeButton";
import { StrikeIndicator } from "../components/StrikeIndicator";
import NeedyModulesPanel from "../components/NeedyModulesPanel";

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
  const [isNeedyPanelOpen, setIsNeedyPanelOpen] = useState(false);

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

  const { regularModules, needyModules } = useMemo(() => {
    const regular: ModuleEntity[] = [];
    const needy: ModuleEntity[] = [];
    
    modules.forEach((module) => {
      // Check if module type is needy
      const isNeedy = ["FORGET_ME_NOT", "VENTING_GAS", "CAPACITOR_DISCHARGE", "KNOBS"].includes(module.type);
      if (isNeedy) {
        needy.push(module);
      } else {
        regular.push(module);
      }
    });
    
    return { regularModules: regular, needyModules: needy };
  }, [modules]);

  const handleModuleClick = (module: ModuleEntity) => {
    if (!currentBomb) return;
    selectModule(currentBomb.id, module.type);
  };

  const handleBack = () => {
    clearModule();
  };

  if (!roundId) {
    return (
      <div className="min-h-screen p-10 lg:p-16">
        <div className="max-w-7xl mx-auto">
          <div className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
            <div className="card-body text-center">
              <p className="text-base-content/70 mb-4">No round selected. Return to setup.</p>
              <button className="btn btn-primary" onClick={() => navigate("/setup")}>
                Back to setup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10 lg:p-16">
      <div className="max-w-7xl mx-auto grid gap-5">
        <header className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-secondary font-medium uppercase tracking-wider">Round #{round?.id?.slice(0, 8)}</p>
                <h1 className="text-3xl font-bold mt-2 mb-4">Live defusal</h1>
                <p className="text-base-content/70">
                  Tabs for each bomb below. Pick the module you&apos;re defusing,
                  study the binder on the left, drive the solver on the right.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StrikeIndicator />
                <div className="flex gap-2">
                  <StrikeButton className="btn-sm" />
                  <button className="btn btn-outline btn-sm" onClick={() => navigate("/rounds")}>
                    All Rounds
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate("/setup")}>
                    Back to setup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {!currentModule ? (
          <section className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
            <div className="card-body">
              <div className="tabs tabs-boxed mb-6">
                {round?.bombs.map((bomb) => (
                  <button
                    key={bomb.id}
                    className={`tab ${
                      currentBomb?.id === bomb.id ? "tab-active" : ""
                    }`}
                    onClick={() => selectBomb(bomb.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{bomb.serialNumber || "Unknown serial"}</div>
                      <div className="text-xs text-base-content/50">{bomb.modules.length} modules</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {regularModules.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-base-content/50">No regular modules assigned to this bomb.</p>
                  </div>
                )}
                {regularModules.map((module) => (
                  <div key={module.id} className="card bg-base-100 border border-base-300 hover:border-primary transition-colors">
                    <div className="card-body">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="card-title">{formatModuleName(module.type)}</h3>
                        <span
                          className={`badge ${
                            module.solved ? "badge-success" : "badge-warning"
                          }`}
                        >
                          {module.solved ? "Solved" : "Awaiting"}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/70 mb-4">
                        {module.solved
                          ? "This module has already been cleared."
                          : "Tap to open the live solving cockpit."}
                      </p>
                      <div className="card-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleModuleClick(module)}
                          disabled={module.solved}
                        >
                          {module.solved ? "Solved" : "Solve module"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="card bg-base-200 border border-base-300 shadow-2xl backdrop-blur-xl">
            <div className="card-body">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-secondary font-medium uppercase tracking-wider">Currently solving</p>
                  <h2 className="text-2xl font-bold mt-1">
                    {formatModuleName(currentModule.moduleType)}
                    <span className="badge badge-primary ml-2">
                      {currentBomb?.serialNumber ?? "Unknown serial"}
                    </span>
                  </h2>
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleBack}>
                  Back to modules
                </button>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card bg-base-100 border border-base-300 h-full">
                  <div className="card-body h-full flex flex-col">
                    <h3 className="card-title text-lg mb-4">Manual</h3>
                    <div className="flex-1 min-h-0">
                      {manualUrl ? (
                        <iframe
                          src={manualUrl}
                          title={`${currentModule.moduleType} manual`}
                          className="w-full h-full rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-base-content/50">
                          Manual loading...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card bg-base-100 border border-base-300 h-full">
                  <div className="card-body h-full flex flex-col">
                    <h3 className="card-title text-lg mb-4">Solver UI</h3>
                    <div className="flex-1">
                      {currentModule.moduleType === "WIRES" ? (
                        <WireSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "BUTTON" ? (
                        <ButtonSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "KEYPADS" ? (
                        <KeypadsSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "MAZES" ? (
                        <MazeSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "MEMORY" ? (
                        <MemorySolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "MORSE_CODE" ? (
                        <MorseCodeSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "PASSWORDS" ? (
                        <PasswordSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "SIMON_SAYS" ? (
                        <SimonSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "WHOS_ON_FIRST" ? (
                        <WhosOnFirstSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "COMPLICATED_WIRES" ? (
                        <ComplicatedWiresSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "WIRE_SEQUENCES" ? (
                        <WireSequencesSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "COLOR_FLASH" ? (
                        <ColorFlashSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "PIANO_KEYS" ? (
                        <PianoKeysSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "SEMAPHORE" ? (
                        <SemaphoreSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "MATH" ? (
                        <MathSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "EMOJI_MATH" ? (
                        <EmojiSolver bomb={currentBomb} />
                      ) : currentModule.moduleType === "SWITCHES" ? (
                        <SwitchesSolver bomb={currentBomb} />
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-sm text-secondary mb-2">Coming soon</p>
                          <p className="text-base-content/70 mb-6">
                            This is where module-specific solver components will live. Hook
                            up forms, logic helpers, or real-time instructions while
                            referencing the manual.
                          </p>
                          <div className="flex justify-center gap-2">
                            <button className="btn btn-primary" disabled>
                              Submit
                            </button>
                            <button className="btn btn-outline" onClick={handleBack}>
                              Back
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      {loading && (
        <div className="fixed inset-0 bg-base-300/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content">Syncing round...</p>
          </div>
        </div>
      )}
      
      {/* Needy Modules Panel */}
      <NeedyModulesPanel
        needyModules={needyModules}
        bomb={currentBomb}
        roundId={roundId || ''}
        bombId={currentBomb?.id || ''}
        isOpen={isNeedyPanelOpen}
        onToggle={() => setIsNeedyPanelOpen(!isNeedyPanelOpen)}
      />
    </div>
  );
}
