import { useCallback, useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { BombEntity } from "../../types";
import {
  solveWhosOnFirst,
  type ButtonPosition,
  type WhosOnFirstSolveRequest,
} from "../../services/whosOnFirstService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ModuleType } from "../../types";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  StageIndicator,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface WhosOnFirstSolverProps {
  bomb: BombEntity | null | undefined;
}

const BUTTON_POSITIONS: { position: ButtonPosition; label: string }[] = [
  { position: "TOP_LEFT", label: "Top-left" },
  { position: "TOP_RIGHT", label: "Top-right" },
  { position: "MIDDLE_LEFT", label: "Middle-left" },
  { position: "MIDDLE_RIGHT", label: "Middle-right" },
  { position: "BOTTOM_LEFT", label: "Bottom-left" },
  { position: "BOTTOM_RIGHT", label: "Bottom-right" },
];

const COMMON_WORDS = [
  "YES", "FIRST", "DISPLAY", "OKAY", "SAYS", "NOTHING", "BLANK", "NO",
  "LED", "LEAD", "READ", "RED", "GREEN", "BLUE", "STREET", "WHEN",
  "PRESS", "YOU", "YOUR", "YOU'RE",
];

const EMPTY_BUTTONS: Record<ButtonPosition, string> = {
  TOP_LEFT: "", TOP_RIGHT: "", MIDDLE_LEFT: "", MIDDLE_RIGHT: "",
  BOTTOM_LEFT: "", BOTTOM_RIGHT: "",
};

interface WhosOnFirstApiState {
  displayHistory: string[];
  buttonHistory: Record<string, string>[];
  buttonPressHistory: Record<string, string>[];
}

function isWhosOnFirstApiState(state: unknown): state is WhosOnFirstApiState {
  if (!state || typeof state !== "object") return false;
  const s = state as Record<string, unknown>;
  return (
    Array.isArray(s.displayHistory) &&
    Array.isArray(s.buttonHistory) &&
    Array.isArray(s.buttonPressHistory)
  );
}

function entryToPositionAndText(
  entry: Record<string, string>,
): { position: ButtonPosition; buttonText: string } | null {
  const keys = Object.keys(entry);
  if (keys.length !== 1) return null;
  const pos = keys[0] as ButtonPosition;
  const text = entry[pos];
  if (typeof text !== "string") return null;
  return { position: pos, buttonText: text };
}

function MiniPositionGrid({ pressedPosition }: { pressedPosition: ButtonPosition }) {
  return (
    <div className="grid h-12 w-10 shrink-0 grid-cols-2 grid-rows-3 gap-0.5" aria-hidden>
      {BUTTON_POSITIONS.map(({ position }) => (
        <div
          key={position}
          className={cn(
            "flex items-center justify-center rounded-sm border text-[10px] font-bold",
            position === pressedPosition
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {position === pressedPosition ? "✓" : ""}
        </div>
      ))}
    </div>
  );
}

export default function WhosOnFirstSolver({ bomb }: WhosOnFirstSolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [displayWord, setDisplayWord] = useState("");
  const [buttons, setButtons] = useState<Record<ButtonPosition, string>>(EMPTY_BUTTONS);
  const [solution, setSolution] = useState<{
    position: ButtonPosition;
    buttonText: string;
  } | null>(null);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const [stageHistory, setStageHistory] = useState<
    { stage: number; displayWord: string; position: ButtonPosition; buttonText: string }[]
  >([]);

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({ currentStage, displayWord, buttons, solution, twitchCommands, stageHistory }),
    [currentStage, displayWord, buttons, solution, twitchCommands, stageHistory],
  );

  const onRestoreState = useCallback((state: unknown) => {
    if (isWhosOnFirstApiState(state)) {
      const { displayHistory, buttonHistory, buttonPressHistory } = state;
      const stageCount = displayHistory.length;
      setCurrentStage(Math.min(stageCount + 1, 3));
      setDisplayWord("");
      setButtons(
        stageCount > 0 && buttonHistory[stageCount - 1]
          ? { ...EMPTY_BUTTONS, ...buttonHistory[stageCount - 1] }
          : EMPTY_BUTTONS,
      );
      const history: {
        stage: number;
        displayWord: string;
        position: ButtonPosition;
        buttonText: string;
      }[] = [];
      for (let i = 0; i < stageCount; i++) {
        const dw = displayHistory[i] ?? "";
        const press = buttonPressHistory[i]
          ? entryToPositionAndText(buttonPressHistory[i])
          : null;
        if (press) {
          history.push({
            stage: i + 1,
            displayWord: dw === " " ? "[BLANK]" : dw,
            position: press.position,
            buttonText: press.buttonText,
          });
        }
      }
      setStageHistory(history);
      const lastPress =
        buttonPressHistory.length > 0
          ? entryToPositionAndText(buttonPressHistory[buttonPressHistory.length - 1])
          : null;
      setSolution(lastPress);
      setTwitchCommands([]);
      return;
    }
    const frontend = state as {
      currentStage?: number;
      displayWord?: string;
      buttons?: Record<ButtonPosition, string>;
      solution?: { position: ButtonPosition; buttonText: string } | null;
      twitchCommands?: string[];
      stageHistory?: {
        stage: number;
        displayWord: string;
        position: ButtonPosition;
        buttonText: string;
      }[];
    };
    if (frontend.currentStage !== undefined)
      setCurrentStage(Math.min(frontend.currentStage ?? 1, 3));
    if (frontend.displayWord !== undefined) setDisplayWord(frontend.displayWord);
    if (frontend.buttons) setButtons(frontend.buttons);
    if (frontend.solution !== undefined) setSolution(frontend.solution);
    if (frontend.twitchCommands) setTwitchCommands(frontend.twitchCommands);
    if (frontend.stageHistory) setStageHistory(frontend.stageHistory);
  }, []);

  const onRestoreSolution = useCallback(
    (
      restored:
        | { finalStage?: number }
        | number
        | { position: ButtonPosition; buttonText: string }
        | null,
    ) => {
      if (
        restored &&
        typeof restored === "object" &&
        "position" in restored &&
        "buttonText" in restored
      ) {
        setSolution(restored as { position: ButtonPosition; buttonText: string });
      }
      const finalStage =
        typeof restored === "number"
          ? restored
          : (restored as { finalStage?: number } | null)?.finalStage;
      if (finalStage) setCurrentStage(Math.min(finalStage, 3));
    },
    [],
  );

  useSolverModulePersistence<
    {
      currentStage: number;
      displayWord: string;
      buttons: Record<ButtonPosition, string>;
      solution: { position: ButtonPosition; buttonText: string } | null;
      twitchCommands: string[];
      stageHistory: {
        stage: number;
        displayWord: string;
        position: ButtonPosition;
        buttonText: string;
      }[];
    },
    { finalStage?: number } | number | { position: ButtonPosition; buttonText: string }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as {
          position?: string;
          buttonText?: string;
          output?: unknown;
          finalStage?: unknown;
        };
        if (typeof anyRaw.position === "string" && typeof anyRaw.buttonText === "string") {
          return {
            position: anyRaw.position as ButtonPosition,
            buttonText: anyRaw.buttonText,
          };
        }
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as { finalStage?: number };
        if (typeof anyRaw.finalStage === "number") return { finalStage: anyRaw.finalStage };
      }
      if (typeof raw === "number") return raw;
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleDisplayChange = (value: string) => {
    const processed = value === "" ? " " : value.toUpperCase();
    setDisplayWord(processed);
    clearError();
    setSolution(null);
    setTwitchCommands([]);
  };

  const handleButtonTextChange = (position: ButtonPosition, value: string) => {
    setButtons((prev) => ({ ...prev, [position]: value.toUpperCase() }));
    clearError();
    setSolution(null);
    setTwitchCommands([]);
  };

  const handleCheckAnswer = async () => {
    const emptyButtons = Object.entries(buttons).filter(([, t]) => !t.trim());
    if (emptyButtons.length > 0) {
      setError("Fill in all 6 button labels.");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();
    try {
      const request: WhosOnFirstSolveRequest = {
        input: {
          displayWord: displayWord === " " ? " " : displayWord.trim(),
          buttons: Object.fromEntries(
            Object.entries(buttons).map(([pos, text]) => [pos, text.trim()]),
          ) as Record<ButtonPosition, string>,
        },
      };
      const response = await solveWhosOnFirst(
        round.id,
        bomb.id,
        currentModule.id,
        request,
      );

      setSolution(response.output);
      setStageHistory((prev) => [
        ...prev,
        {
          stage: currentStage,
          displayWord: displayWord === " " ? "[BLANK]" : displayWord.trim(),
          position: response.output.position,
          buttonText: response.output.buttonText,
        },
      ]);
      setTwitchCommands([
        generateTwitchCommand({
          moduleType: ModuleType.WHOS_ON_FIRST,
          result: {
            position: response.output.position.replace("_", " "),
            button: response.output.buttonText,
          },
        }),
      ]);

      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else if (currentStage < 3) {
        setCurrentStage(currentStage + 1);
        setDisplayWord("");
        setSolution(null);
        setTwitchCommands([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Who's On First");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCurrentStage(1);
    setDisplayWord("");
    setButtons(EMPTY_BUTTONS);
    setSolution(null);
    setTwitchCommands([]);
    setStageHistory([]);
    resetSolverState();
  };

  const stageIdx = Math.min(currentStage, 3);
  const displayValue = displayWord === " " ? "" : displayWord;

  return (
    <SolverLayout>
      <SolverSection title="Stage progress">
        <StageIndicator total={3} current={stageIdx} completedThrough={stageHistory.length} />
      </SolverSection>

      <SolverSection
        title="Display word"
        description="The word printed on the small screen. Leave blank if the display is empty."
      >
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => handleDisplayChange(e.target.value)}
          placeholder="(blank)"
          disabled={isSolved || isLoading}
          aria-label="Display word"
          className="text-center font-mono text-lg uppercase tracking-widest"
        />
        {!isSolved && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {COMMON_WORDS.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => handleDisplayChange(word)}
                disabled={isSolved || isLoading}
                className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </SolverSection>

      <SolverSection
        title="Button labels"
        description="Enter the word on each of the six buttons."
      >
        <div className="grid grid-cols-2 gap-2">
          {BUTTON_POSITIONS.map(({ position, label }) => {
            const isAnswer = solution?.position === position && !isSolved;
            return (
              <div
                key={position}
                className={cn(
                  "relative rounded-lg border p-2 transition-colors",
                  isAnswer
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-border bg-muted/30",
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </span>
                  {isAnswer && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      <Check className="h-2.5 w-2.5" /> Press
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  value={buttons[position]}
                  onChange={(e) => handleButtonTextChange(position, e.target.value)}
                  placeholder="WORD"
                  disabled={isSolved || isLoading}
                  aria-label={`${label} button text`}
                  className="h-8 text-center font-mono uppercase"
                />
              </div>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleCheckAnswer}
        onReset={reset}
        isSolveDisabled={Object.values(buttons).some((b) => !b.trim())}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText={
          isSolved
            ? "Module Solved"
            : stageIdx === 3
              ? "Final stage"
              : `Solve stage ${stageIdx}`
        }
      />

      <ErrorAlert error={error} />

      {solution && !isSolved && (
        <>
          <SolverResult
            variant="success"
            title={`Press: ${solution.position.replace("_", " ")} — "${solution.buttonText}"`}
            description={`Stage ${stageIdx} of 3`}
          />
          <TwitchCommandDisplay command={twitchCommands} />
        </>
      )}

      {stageHistory.length > 0 && (
        <SolverSection title="Stage history">
          <ul className="space-y-2 text-sm">
            {stageHistory.map((stage, index) => (
              <li
                key={index}
                className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2"
              >
                <MiniPositionGrid pressedPosition={stage.position} />
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="shrink-0 font-semibold">Stage {stage.stage}</span>
                  <span className="text-muted-foreground">
                    “{stage.displayWord === "[BLANK]" ? "(blank)" : stage.displayWord}” →{" "}
                    {stage.position.replace("_", " ")}
                  </span>
                  <span className="font-medium">“{stage.buttonText}”</span>
                </div>
              </li>
            ))}
          </ul>
        </SolverSection>
      )}

      <SolverInstructions>
        Three stages total. Enter the display word (or leave blank) and the text
        of all six buttons — the solver reveals which one to press. Pressing
        correctly advances the module; the buttons may change for the next
        stage.
      </SolverInstructions>
    </SolverLayout>
  );
}
