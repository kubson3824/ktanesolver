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

function SymbolPicker({ symbols, selected, onSelect, disabled }: {
  symbols: string[]; selected: string[]; onSelect: (code: string) => void; disabled: boolean;
}) {
  return <fieldset>
    <legend className="mb-2 text-sm font-semibold">Scanned symbols ({selected.length}/3)</legend>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {symbols.map((code, index) => <button
        key={code}
        type="button"
        onClick={() => onSelect(code)}
        disabled={disabled || selected.length === 3 && !selected.includes(code)}
        aria-label={`Scanned symbol option ${index + 1}`}
        aria-pressed={selected.includes(code)}
        className={cn(
          "flex min-h-14 items-center justify-center rounded-md border bg-muted/30 p-1 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
          selected.includes(code) && "border-primary bg-primary/10 ring-2 ring-primary",
        )}
      ><XRaySymbol code={code} /></button>)}
    </div>
  </fieldset>;
}

type PersistedState = { symbols?: string[]; column?: number; row?: number; movement?: number };

export default function XRaySolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [result, setResult] = useState<XRayOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ symbols }), [symbols]);

  useSolverModulePersistence<PersistedState, XRayOutput>({
    state: savedState,
    onRestoreState: useCallback((state) => {
      if (Array.isArray(state.symbols)) setSymbols(state.symbols);
      else setSymbols([
        typeof state.column === "number" ? XRAY_COLUMNS[state.column] : "",
        typeof state.row === "number" ? XRAY_ROWS[state.row] : "",
        typeof state.movement === "number" ? XRAY_MOVEMENTS[state.movement] : "",
      ].filter(Boolean));
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

  const valid = symbols.length === 3;
  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!valid) return setError("Select all three scanned symbols");
    clearError(); setIsLoading(true);
    try {
      const input = { symbols };
      const response = await solveXRay(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.X_RAY, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        ...input,
        scannedSymbols: symbols,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve X-Ray"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, valid, symbols, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setSymbols([]); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  const toggleSymbol = useCallback((code: string) => setSymbols((selected) => selected.includes(code)
    ? selected.filter((symbol) => symbol !== code)
    : selected.length < 3 ? [...selected, code] : selected), []);

  return <SolverLayout>
    {!isSolved && <SolverSection title="Scanned symbols" description="Select the three symbols shown by the scanner; their order does not matter.">
      <div className="space-y-5">
        <SymbolPicker symbols={XRAY_SYMBOLS} selected={symbols} onSelect={toggleSymbol} disabled={isLoading} />
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
