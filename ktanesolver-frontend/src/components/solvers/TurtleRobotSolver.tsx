import { useState } from "react";
import { solveTurtleRobot, type TurtleRobotOutput } from "../../services/turtleRobotService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
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

interface PersistedState {
  commandsText?: string;
  input?: { commands?: string[] };
  result?: TurtleRobotOutput | null;
  twitchCommand?: string;
}

export default function TurtleRobotSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [commandsText, setCommandsText] = useState("");
  const [result, setResult] = useState<TurtleRobotOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const commands = commandsText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  useSolverModulePersistence<PersistedState, TurtleRobotOutput>({
    state: { commandsText, result, twitchCommand },
    onRestoreState: (state) => {
      if (state.input?.commands) setCommandsText(state.input.commands.join("\n"));
      else if (state.commandsText !== undefined) setCommandsText(state.commandsText);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.TURTLE_ROBOT, result: solution }));
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (commands.length < 15 || commands.length > 22) return setError("Enter all 15 to 22 displayed commands");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveTurtleRobot(round.id, bomb.id, currentModule.id, commands);
      const command = generateTwitchCommand({ moduleType: ModuleType.TURTLE_ROBOT, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { commandsText, result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Turtle Robot");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCommandsText("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return <SolverLayout>
    <SolverSection
      title="Turtle program"
      description="Scroll through the module and enter every command in order, one per line."
    >
      <label htmlFor="turtle-robot-commands" className="block text-sm font-medium">
        Displayed commands
      </label>
      <textarea
        id="turtle-robot-commands"
        value={commandsText}
        onChange={(event) => {
          setCommandsText(event.target.value.toUpperCase());
          if (error) clearError();
        }}
        rows={12}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={isLoading || isSolved}
        placeholder={"FD 2\nLT 90\nRT 180 4"}
        aria-describedby="turtle-robot-command-help"
        className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <p id="turtle-robot-command-help" className="mt-2 text-xs text-muted-foreground">
        Use the exact FD, LT, and RT commands shown on the module. Entered: {commands.length}.
      </p>
    </SolverSection>

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={commands.length < 15 || commands.length > 22}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText="Find bugs"
    />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Result">
      <p className="text-center font-semibold text-emerald-700 dark:text-emerald-400">
        Comment out lines {result.bugLines.join(", ")} ({result.shape}).
      </p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      The cursor starts on line 1. Use the arrow buttons to reach each listed line and press # to comment it out.
    </SolverInstructions>
  </SolverLayout>;
}
