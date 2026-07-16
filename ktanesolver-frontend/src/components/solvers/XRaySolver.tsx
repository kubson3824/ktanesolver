import { useCallback, useMemo, useState, type CSSProperties } from "react";

import { cn } from "../../lib/cn";
import { solveXRay, type XRayOutput } from "../../services/xRayService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

export const XRAY_COLUMNS = [
  "a1", "a1 flipped", "b1", "b1 flipped", "c1", "c1 flipped",
  "d1", "d1 flipped", "e1", "e1 flipped", "h2 flipped", "h2",
];
export const XRAY_ROWS = ["d7", "j1", "h6", "g1", "a6", "a2", "k2", "h1", "a7", "e2", "d6", "b3"];
export const XRAY_MOVEMENTS = ["a10", "b10", "c10", "d10", "e10", "f10", "i10", "h9", "i9"];
export const XRAY_SYMBOLS = [...XRAY_COLUMNS, ...XRAY_ROWS, ...XRAY_MOVEMENTS];

export function XRaySymbol({ code, className }: { code: string; className?: string }) {
  const [cell, orientation] = code.split(" ");
  const column = cell.charCodeAt(0) - 97;
  const row = Number(cell.slice(1)) - 1;
  const style: CSSProperties = {
    backgroundImage: "url(https://ktane.timwi.de/HTML/img/X-Ray/Icons.svg)",
    backgroundPosition: `${-column * 48}px ${-row * 48}px`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "528px 480px",
    transform: orientation === "flipped" ? "scaleY(-1)" : undefined,
  };
  return <span className={cn("inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-white", className)} role="img" aria-label="X-Ray symbol">
    <span className="block h-12 w-12" style={style} />
  </span>;
}

function SymbolPicker({ label, symbols, selected, onSelect, disabled }: {
  label: string; symbols: string[]; selected: number; onSelect: (index: number) => void; disabled: boolean;
}) {
  return <fieldset>
    <legend className="mb-2 text-sm font-semibold">{label}</legend>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {symbols.map((code, index) => <button
        key={code}
        type="button"
        onClick={() => onSelect(index)}
        disabled={disabled}
        aria-label={`${label} ${index + 1}`}
        aria-pressed={selected === index}
        className={cn(
          "flex min-h-14 items-center justify-center rounded-md border bg-muted/30 p-1 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
          selected === index && "border-primary bg-primary/10 ring-2 ring-primary",
        )}
      ><XRaySymbol code={code} /></button>)}
    </div>
  </fieldset>;
}

type PersistedState = { column?: number; row?: number; movement?: number };

export default function XRaySolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [column, setColumn] = useState(-1);
  const [row, setRow] = useState(-1);
  const [movement, setMovement] = useState(-1);
  const [result, setResult] = useState<XRayOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ column, row, movement }), [column, row, movement]);

  useSolverModulePersistence<PersistedState, XRayOutput>({
    state: savedState,
    onRestoreState: useCallback((state) => {
      if (typeof state.column === "number") setColumn(state.column);
      if (typeof state.row === "number") setRow(state.row);
      if (typeof state.movement === "number") setMovement(state.movement);
    }, []),
    onRestoreSolution: useCallback((solution: XRayOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.X_RAY, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "button" in raw ? raw as XRayOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const valid = column >= 0 && row >= 0 && movement >= 0;
  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!valid) return setError("Select all three scanned symbols");
    clearError(); setIsLoading(true);
    try {
      const input = { column, row, movement };
      const response = await solveXRay(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.X_RAY, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        ...input,
        scannedSymbols: [XRAY_COLUMNS[column], XRAY_ROWS[row], XRAY_MOVEMENTS[movement]],
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve X-Ray"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, valid, column, row, movement, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setColumn(-1); setRow(-1); setMovement(-1); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    {!isSolved && <SolverSection title="Scanned symbols" description="Match each symbol to the table where it appears in the manual.">
      <div className="space-y-5">
        <SymbolPicker label="Column symbol" symbols={XRAY_COLUMNS} selected={column} onSelect={setColumn} disabled={isLoading} />
        <SymbolPicker label="Row symbol" symbols={XRAY_ROWS} selected={row} onSelect={setRow} disabled={isLoading} />
        <SymbolPicker label="Movement symbol" symbols={XRAY_MOVEMENTS} selected={movement} onSelect={setMovement} disabled={isLoading} />
      </div>
    </SolverSection>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!valid} solveText="Find button" />
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Press ${result.button}`} description={`Destination: row ${result.destinationRow}, column ${result.destinationColumn}.`} className="border-emerald-500/40">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-500 bg-emerald-500/15 text-5xl font-bold text-emerald-700 dark:text-emerald-300">{result.button}</div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The scanner direction does not affect the answer. The movement table’s center means stay on the row-and-column intersection.</SolverInstructions>
  </SolverLayout>;
}
