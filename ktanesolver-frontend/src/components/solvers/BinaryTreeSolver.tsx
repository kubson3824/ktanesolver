import { useCallback, useMemo, useState } from "react";
import {
  BINARY_TREE_COLORS,
  solveBinaryTree,
  type BinaryTreeInput,
  type BinaryTreeNodeInput,
  type BinaryTreeOutput,
} from "../../services/binaryTreeService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

const newNodes = (): BinaryTreeNodeInput[] =>
  Array.from({ length: 7 }, () => ({ color: "RED", character: "0", silver: false }));

interface BinaryTreeSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function BinaryTreeSolver({ bomb }: BinaryTreeSolverProps) {
  const [nodes, setNodes] = useState(newNodes);
  const [result, setResult] = useState<BinaryTreeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ nodes, result, twitchCommand }), [nodes, result, twitchCommand]);

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<BinaryTreeInput> }) => {
    const input = state.input ?? state;
    if (input.nodes?.length === 7) setNodes(input.nodes);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: BinaryTreeOutput) => {
    if (!solution?.presses?.length) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BINARY_TREE, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, BinaryTreeOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as BinaryTreeOutput & { output?: BinaryTreeOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updateNode = (index: number, patch: Partial<BinaryTreeNodeInput>) => {
    setNodes((current) => current.map((node, position) => position === index ? { ...node, ...patch } : node));
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (nodes.some((node) => !/^[0-9A-NP-Z]$/.test(node.character))) {
      return setError("Enter one digit or uppercase letter except O for every node");
    }
    clearError();
    setIsLoading(true);
    try {
      const input = { nodes };
      const response = await solveBinaryTree(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.BINARY_TREE, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Binary Tree");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, nodes, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setNodes(newNodes());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection title="Tree nodes" description="Enter nodes 1–7 in reading order: root, second row, then bottom row.">
        <div className="grid grid-cols-4 gap-3">
          {nodes.map((node, index) => (
            <fieldset
              key={index}
              className={`rounded-lg border p-3 ${index === 0 ? "col-span-2 col-start-2" : index < 3 ? "col-span-2" : ""}`}
              disabled={isLoading || isSolved}
            >
              <legend className="px-1 text-sm font-medium">Node {index + 1}</legend>
              <label className="block text-xs text-muted-foreground">
                Color
                <select
                  aria-label={`Node ${index + 1} color`}
                  value={node.color}
                  onChange={(event) => updateNode(index, { color: event.target.value as BinaryTreeNodeInput["color"] })}
                  className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm"
                >
                  {BINARY_TREE_COLORS.map((color) => <option key={color}>{color}</option>)}
                </select>
              </label>
              <label className="mt-2 block text-xs text-muted-foreground">
                Character
                <input
                  aria-label={`Node ${index + 1} character`}
                  value={node.character}
                  maxLength={1}
                  onChange={(event) => updateNode(index, { character: event.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-center font-mono text-base"
                />
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={node.silver}
                  onChange={(event) => updateNode(index, { silver: event.target.checked })}
                />
                Silver text
              </label>
            </fieldset>
          ))}
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find presses" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Press sequence" description="Press one node at each stage." className="border-emerald-500/40">
          <ol className="grid gap-3 sm:grid-cols-3">
            {result.presses.map((press, index) => (
              <li key={index} className="rounded-lg border bg-muted/30 p-3 text-center">
                <div className="text-sm text-muted-foreground">Stage {index + 1}</div>
                <div className="text-2xl font-semibold">Node {press}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Reference {result.referenceNodes[index]} · {result.orderings[index].replaceAll("_", " ").toLowerCase()}
                </div>
              </li>
            ))}
          </ol>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>“Silver text” means the light text color; leave it unchecked for black text.</SolverInstructions>
    </SolverLayout>
  );
}
