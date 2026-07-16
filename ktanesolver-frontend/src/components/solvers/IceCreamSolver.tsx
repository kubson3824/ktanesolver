import { useCallback, useMemo, useState } from "react";
import { solveIceCream, type IceCreamOutput } from "../../services/iceCreamService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { Button } from "../ui";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const CUSTOMERS = ["Mike", "Tim", "Tom", "Dave", "Adam", "Cheryl", "Sean", "Ashley", "Jessica", "Taylor", "Simon", "Sally", "Jade", "Sam", "Gary", "Victor", "George", "Jacob", "Pat", "Bob"];
const FLAVORS = ["Tutti Frutti", "Rocky Road", "Raspberry Ripple", "Double Chocolate", "Double Strawberry", "Cookies and Cream", "Neapolitan", "Mint Chocolate Chip", "The Classic", "Vanilla"];
const EMPTY_FLAVORS = ["", "", "", "", "Vanilla"];

interface IceCreamStage {
  customer: string;
  offeredFlavors: string[];
  soldFlavor: string;
}

export default function IceCreamSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [customer, setCustomer] = useState(CUSTOMERS[0]);
  const [flavors, setFlavors] = useState(EMPTY_FLAVORS);
  const [stages, setStages] = useState<IceCreamStage[]>([]);
  const [resetStage, setResetStage] = useState(false);
  const [result, setResult] = useState<IceCreamOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ stages }), [stages]);
  const currentStage = stages.length + 1;

  useSolverModulePersistence<typeof savedState, IceCreamOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.stages)) setStages(saved.stages);
    }, []),
    onRestoreSolution: useCallback((solution: IceCreamOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ICE_CREAM, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (flavors.some((flavor) => !flavor)) return setError("Select all five offered flavors");
    if (new Set(flavors).size !== 5) return setError("The five offered flavors must be different");
    if (!flavors.includes("Vanilla")) return setError("Vanilla is always one of the offered flavors");
    clearError(); setIsLoading(true);
    try {
      const response = await solveIceCream(round.id, bomb.id, currentModule.id, { customer, flavors, resetStage });
      const nextStages = [...stages, { customer, offeredFlavors: flavors, soldFlavor: response.output.flavor }];
      const command = generateTwitchCommand({ moduleType: ModuleType.ICE_CREAM, result: response.output });
      setStages(nextStages); setResult(response.output); setTwitchCommand(command); setResetStage(false); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else { setFlavors(EMPTY_FLAVORS); setCustomer(CUSTOMERS[0]); }
      updateModuleAfterSolve(bomb.id, currentModule.id, { stages: nextStages }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Ice Cream"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, customer, flavors, resetStage, stages, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const strike = () => {
    setStages((current) => current.slice(0, -1));
    setResetStage(true); setResult(null); setTwitchCommand(""); setFlavors(EMPTY_FLAVORS); setCustomer(CUSTOMERS[0]); clearError();
  };

  return <SolverLayout>
    <SolverSection title="Customer progress" description={isSolved ? "All three customers served." : `Customer ${currentStage} of 3`}>
      <StageIndicator total={3} current={isSolved ? 4 : currentStage} completedThrough={stages.length} />
    </SolverSection>

    {!isSolved && !result && <>
      <SolverSection title={`Customer ${currentStage}`} description="Select the name currently shown on the module.">
        <label className="block text-sm font-medium">Customer name
          <select value={customer} onChange={(event) => setCustomer(event.target.value)} disabled={isLoading} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            {CUSTOMERS.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
      </SolverSection>

      <SolverSection title="Offered flavors" description="Starting with the flavor currently displayed, cycle right and enter all five in order.">
        <div className="grid gap-3 sm:grid-cols-2">
          {flavors.map((flavor, index) => <label key={index} className="text-sm font-medium">Flavor {index + 1}
            <select value={flavor} onChange={(event) => setFlavors((current) => current.map((item, i) => i === index ? event.target.value : item))} disabled={isLoading} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
              <option value="">Select flavor</option>
              {FLAVORS.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>)}
        </div>
      </SolverSection>
    </>}

    {!result && <SolverControls onSolve={solve} onReset={() => setFlavors(EMPTY_FLAVORS)} showReset={false} isLoading={isLoading} isSolved={isSolved} solveText={`Solve customer ${currentStage}`} />}
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Customer ${result.stage}: sell ${result.flavor}`} className="border-emerald-500/40">
      <p className="text-center text-2xl font-bold">{result.flavor}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">Flavor {result.flavorIndex} in the entered cycle. Sell only during an even-numbered minute.</p>
      {!isSolved && <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => { setResult(null); setTwitchCommand(""); }}>Enter customer {currentStage}</Button>
        <Button type="button" variant="outline" onClick={strike}>This selection struck</Button>
      </div>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Sell the listed flavor when the timer’s minute is even. A strike regenerates the current and future displays; use the strike button above before entering the replacement customer.</SolverInstructions>
  </SolverLayout>;
}
