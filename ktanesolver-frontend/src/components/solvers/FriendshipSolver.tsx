import { useCallback, useMemo, useState } from "react";
import { solveFriendship, type FriendshipOutput, type FriendshipSymbol } from "../../services/friendshipService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

const COLUMN_SYMBOLS = [
  "Amethyst Star", "Apple Cinnamon", "Apple Fritter", "Babs Seed", "Berryshine", "Big McIntosh", "Bulk Biceps", "Cadance", "Golden Harvest", "Celestia", "Cheerilee", "Cheese Sandwich", "Cherry Jubilee", "Coco Pommel",
  "Starlight Glimmer", "Spoiled Rich", "Silverstar", "Silver Spoon", "Silver Shill", "Shining Armor", "Screwball", "Rose", "Octavia Melody", "Nurse Redheart", "Night Light", "Ms. Harshwhinny", "Moon Dancer", "Mayor Mare",
].sort();
const ROW_SYMBOLS = [
  "Coloratura", "Daisy", "Daring Do", "Derpy", "Diamond Tiara", "Double Diamond", "Filthy Rich", "Granny Smith", "Hoity Toity", "Lightning Dust", "Lily", "Luna", "Lyra", "Maud Pie",
  "Vinyl Scratch", "Twist", "Twilight Velvet", "Trouble Shoes", "Trixie", "Trenderhoof", "Tree Hugger", "Toe Tapper", "Time Turner", "Thunderlane", "Sweetie Drops", "Suri Polomare", "Sunset Shimmer", "Sunburst",
].sort();
// Must match ELEMENTS in FriendshipSolver.java
const ELEMENTS = [
  "Altruism", "Amicability", "Authenticity", "Benevolence", "Caring", "Charitableness", "Compassion",
  "Conscientiousness", "Consideration", "Courage", "Fairness", "Flexibility", "Generosity", "Helpfulness",
  "Honesty", "Inspiration", "Kindness", "Laughter", "Loyalty", "Open-mindedness", "Patience", "Resoluteness",
  "Selflessness", "Sincerity", "Solidarity", "Support", "Sympathy", "Thoughtfulness",
];
const EMPTY_SYMBOLS = Array.from({ length: 6 }, (): FriendshipSymbol => ({ name: "", x: 1, y: 1 }));
const EMPTY_ELEMENTS = Array<string>(7).fill("");

const symbolImg = (name: string) => `https://ktane.timwi.de/HTML/img/Friendship/${encodeURIComponent(name)}.png`;

function PositionStepper({ label, value, max, disabled, onChange }: {
  label: string; value: number; max: number; disabled?: boolean; onChange: (value: number) => void;
}) {
  const clamp = (next: number) => onChange(Number.isNaN(next) ? 1 : Math.min(max, Math.max(1, next)));
  const buttonClass = "w-7 shrink-0 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40";
  return <div className="mt-1 flex h-10 items-stretch overflow-hidden rounded-md border bg-background">
    <button type="button" aria-label={`Decrease ${label}`} disabled={disabled || value <= 1} onClick={() => clamp(value - 1)} className={buttonClass}>−</button>
    <input aria-label={label} type="number" min={1} max={max} value={value} disabled={disabled}
      onChange={(event) => clamp(Number(event.target.value))}
      className="w-full min-w-0 border-x bg-transparent text-center font-mono text-sm text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
    <button type="button" aria-label={`Increase ${label}`} disabled={disabled || value >= max} onClick={() => clamp(value + 1)} className={buttonClass}>+</button>
  </div>;
}

export default function FriendshipSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [symbols, setSymbols] = useState(EMPTY_SYMBOLS);
  const [displayedElements, setDisplayedElements] = useState(EMPTY_ELEMENTS);
  const [openPicker, setOpenPicker] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [result, setResult] = useState<FriendshipOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ symbols, displayedElements, result, twitchCommand }), [symbols, displayedElements, result, twitchCommand]);

  const onRestoreState = useCallback((state: Partial<typeof moduleState>) => {
    if (state.symbols?.length === 6) setSymbols(state.symbols);
    if (state.displayedElements?.length === 7) setDisplayedElements(state.displayedElements);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);
  const onRestoreSolution = useCallback((solution: FriendshipOutput) => {
    if (!solution?.element) return;
    setResult(solution);
    setTwitchCommand(`submit ${solution.element}`);
  }, []);
  useSolverModulePersistence<typeof moduleState, FriendshipOutput>({
    state: moduleState, onRestoreState, onRestoreSolution, currentModule, setIsSolved,
  });

  const changeSymbol = (index: number, patch: Partial<FriendshipSymbol>) => {
    setSymbols((current) => current.map((symbol, i) => i === index ? { ...symbol, ...patch } : symbol));
    setResult(null); setTwitchCommand(""); clearError();
  };
  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { symbols, displayedElements };
      const response = await solveFriendship(round.id, bomb.id, currentModule.id, input);
      const command = `submit ${response.output.element}`;
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Friendship"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, symbols, displayedElements, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);
  const reset = useCallback(() => {
    setSymbols(EMPTY_SYMBOLS); setDisplayedElements(EMPTY_ELEMENTS); setResult(null); setTwitchCommand("");
    setOpenPicker(null); setFilter(""); resetSolverState();
  }, [resetSolverState]);

  const query = filter.trim().toLowerCase();
  const pickerGroups = [
    { label: "Column symbols", names: COLUMN_SYMBOLS.filter((name) => name.toLowerCase().includes(query)) },
    { label: "Row symbols", names: ROW_SYMBOLS.filter((name) => name.toLowerCase().includes(query)) },
  ];

  return <SolverLayout>
    <SolverSection title="Friendship symbols" description="Pick each symbol and its approximate display grid position: column 1 is leftmost, row 1 is topmost.">
      <div className="space-y-3">
        {symbols.map((symbol, index) => <div key={index} className="rounded-lg border p-2">
          <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-end gap-2">
            <div className="flex h-10 items-center justify-center overflow-hidden rounded bg-white">
              {symbol.name ? <img className="h-9 w-9 object-contain" src={symbolImg(symbol.name)} alt="" /> : <span className="text-muted-foreground">{index + 1}</span>}
            </div>
            <label className="min-w-0 text-xs text-muted-foreground">Symbol
              <button type="button" aria-label={`Symbol ${index + 1}`} disabled={isLoading || isSolved}
                onClick={() => { setOpenPicker(openPicker === index ? null : index); setFilter(""); }}
                className="mt-1 h-10 w-full truncate rounded-md border bg-background px-2 text-left text-sm text-foreground">
                {symbol.name || <span className="text-muted-foreground">Choose…</span>}
              </button>
            </label>
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="text-xs text-muted-foreground">Column
                <PositionStepper label={`Symbol ${index + 1} column`} value={symbol.x} max={13} disabled={isLoading || isSolved} onChange={(x) => changeSymbol(index, { x })} />
              </div>
              <div className="text-xs text-muted-foreground">Row
                <PositionStepper label={`Symbol ${index + 1} row`} value={symbol.y} max={9} disabled={isLoading || isSolved} onChange={(y) => changeSymbol(index, { y })} />
              </div>
            </div>
          </div>
        </div>)}
      </div>
    </SolverSection>
    <Dialog open={openPicker !== null} onOpenChange={(open) => { if (!open) { setOpenPicker(null); setFilter(""); } }}>
      <DialogContent className="mx-2 flex max-h-[90dvh] w-[calc(100%_-_1rem)] flex-col data-[state=open]:!animate-none sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose symbol {openPicker === null ? "" : openPicker + 1}</DialogTitle>
          <DialogDescription>Search by name or pick the matching picture.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3 overflow-y-auto">
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Type to filter…"
            aria-label="Filter friendship symbols" className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground" />
          {pickerGroups.every((group) => group.names.length === 0) && <p className="text-sm text-muted-foreground">No matches.</p>}
          {pickerGroups.map((group) => group.names.length > 0 && <div key={group.label}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{group.label}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {group.names.map((name) => {
                const used = symbols.some((other, i) => i !== openPicker && other.name === name);
                return <button key={name} type="button" disabled={used}
                  onClick={() => { if (openPicker !== null) changeSymbol(openPicker, { name }); setOpenPicker(null); setFilter(""); }}
                  className="flex min-w-0 flex-col items-center gap-1 rounded-md border p-2 text-center hover:bg-accent disabled:opacity-30">
                  <span className="rounded bg-white p-0.5"><img src={symbolImg(name)} alt="" loading="lazy" className="h-12 w-12 object-contain" /></span>
                  <span className="w-full break-words text-[10px] leading-tight text-foreground">{name}</span>
                </button>;
              })}
            </div>
          </div>)}
        </DialogBody>
      </DialogContent>
    </Dialog>
    <SolverSection title="Displayed Elements of Harmony" description="Copy all seven words shown on the cylinder.">
      <datalist id="friendship-elements">{ELEMENTS.map((element) => <option key={element} value={element} />)}</datalist>
      <div className="grid gap-2 sm:grid-cols-2">
        {displayedElements.map((element, index) => <input key={index} list="friendship-elements" aria-label={`Displayed element ${index + 1}`}
          value={element} placeholder={`Element ${index + 1}`}
          onChange={(event) => { setDisplayedElements((current) => current.map((value, i) => i === index ? event.target.value : value)); setResult(null); clearError(); }}
          disabled={isLoading || isSolved} className="h-10 rounded-md border bg-background px-3 text-foreground" />)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find element" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Select this Element of Harmony" className="border-emerald-500/40"><p className="text-center text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.element}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Pick the six symbols by their picture, enter their positions, then type the seven cylinder words — the inputs suggest valid element names as you type. Positions only need to preserve which symbols share a column or row and which is furthest left or up.</SolverInstructions>
  </SolverLayout>;
}
