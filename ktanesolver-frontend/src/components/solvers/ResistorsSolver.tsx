import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import {
  RESISTOR_DIGIT_COLORS,
  RESISTOR_MULTIPLIER_COLORS,
  solveResistors,
  type ResistorsBands,
  type ResistorsColor,
  type ResistorsDigitColor,
  type ResistorsMultiplierColor,
  type ResistorsOutput,
  type ResistorsPath,
} from "../../services/resistorsService";
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

interface ResistorsSolverProps {
  bomb: BombEntity | null | undefined;
}

type EditableBands = {
  firstBand: ResistorsDigitColor | null;
  secondBand: ResistorsDigitColor | null;
  multiplierBand: ResistorsMultiplierColor | null;
};

const EMPTY_BANDS: EditableBands = {
  firstBand: null,
  secondBand: null,
  multiplierBand: null,
};

const SWATCH_CLASSES: Record<ResistorsColor, string> = {
  BLACK: "bg-black",
  BROWN: "bg-amber-800",
  RED: "bg-red-600",
  ORANGE: "bg-orange-500",
  YELLOW: "bg-yellow-400",
  GREEN: "bg-green-600",
  BLUE: "bg-blue-600",
  VIOLET: "bg-violet-600",
  GRAY: "bg-gray-500",
  WHITE: "bg-white",
  GOLD: "bg-yellow-600",
  SILVER: "bg-slate-300",
};

const PATH_LABELS: Record<ResistorsPath, string> = {
  DIRECT: "No resistors",
  TOP: "Top resistor",
  BOTTOM: "Bottom resistor",
  SERIES: "Both resistors in series",
  PARALLEL: "Both resistors in parallel",
};

const resistanceFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

function formatResistance(value: number) {
  return `${resistanceFormatter.format(value)} Ω`;
}

function routeLabel(input: string, output: string, path: ResistorsPath) {
  switch (path) {
    case "DIRECT":
      return `${input} → ${output}`;
    case "TOP":
      return `${input} → top resistor → ${output}`;
    case "BOTTOM":
      return `${input} → bottom resistor → ${output}`;
    case "SERIES":
      return `${input} → top resistor → bottom resistor → ${output}`;
    case "PARALLEL":
      return `${input} → top and bottom resistors in parallel → ${output}`;
  }
}

function BandSelect<T extends ResistorsColor>({
  label,
  value,
  colors,
  disabled,
  onChange,
}: {
  label: string;
  value: T | null;
  colors: readonly T[];
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value as T)}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" disabled>
          Select color
        </option>
        {colors.map((color) => (
          <option key={color} value={color}>
            {color.charAt(0) + color.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResistorBandsInput({
  title,
  bands,
  disabled,
  onChange,
}: {
  title: string;
  bands: EditableBands;
  disabled: boolean;
  onChange: (bands: EditableBands) => void;
}) {
  const previewBands = [bands.firstBand, bands.secondBand, bands.multiplierBand];

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div
          className="flex h-7 w-24 items-stretch justify-center gap-1 rounded-full border border-amber-900/30 bg-amber-200 px-5"
          aria-label={`${title} band preview`}
        >
          {previewBands.map((color, index) => (
            <span
              key={index}
              className={cn(
                "w-2 border-x border-black/15",
                color ? SWATCH_CLASSES[color] : "bg-muted-foreground/20",
              )}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <BandSelect
          label="First band"
          value={bands.firstBand}
          colors={RESISTOR_DIGIT_COLORS}
          disabled={disabled}
          onChange={(firstBand) => onChange({ ...bands, firstBand })}
        />
        <BandSelect
          label="Second band"
          value={bands.secondBand}
          colors={RESISTOR_DIGIT_COLORS}
          disabled={disabled}
          onChange={(secondBand) => onChange({ ...bands, secondBand })}
        />
        <BandSelect
          label="Multiplier"
          value={bands.multiplierBand}
          colors={RESISTOR_MULTIPLIER_COLORS}
          disabled={disabled}
          onChange={(multiplierBand) => onChange({ ...bands, multiplierBand })}
        />
      </div>
    </div>
  );
}

function completeBands(bands: EditableBands): bands is ResistorsBands {
  return Boolean(bands.firstBand && bands.secondBand && bands.multiplierBand);
}

export default function ResistorsSolver({ bomb }: ResistorsSolverProps) {
  const [topResistor, setTopResistor] = useState<EditableBands>({ ...EMPTY_BANDS });
  const [bottomResistor, setBottomResistor] = useState<EditableBands>({ ...EMPTY_BANDS });
  const [result, setResult] = useState<ResistorsOutput | null>(null);

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
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.RESISTORS, result }) : "";

  const moduleState = useMemo(
    () => ({ topResistor, bottomResistor, result }),
    [topResistor, bottomResistor, result],
  );

  const onRestoreState = useCallback(
    (state: {
      topResistor?: EditableBands;
      bottomResistor?: EditableBands;
      result?: ResistorsOutput | null;
    }) => {
      if (state.topResistor) setTopResistor(state.topResistor);
      if (state.bottomResistor) setBottomResistor(state.bottomResistor);
      if (state.result !== undefined) setResult(state.result);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: ResistorsOutput) => {
    setResult(solution);
  }, []);

  useSolverModulePersistence<
    {
      topResistor: EditableBands;
      bottomResistor: EditableBands;
      result: ResistorsOutput | null;
    },
    ResistorsOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const value = raw as Partial<ResistorsOutput>;
      return typeof value.targetResistanceOhms === "number" &&
        Array.isArray(value.requiredConnections) &&
        typeof value.instruction === "string"
        ? (raw as ResistorsOutput)
        : null;
    },
    inferSolved: (_solution, module) =>
      Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    if (!completeBands(topResistor) || !completeBands(bottomResistor)) {
      setError("Select all three bands for both resistors.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveResistors(round.id, bomb.id, currentModule.id, {
        input: { topResistor, bottomResistor },
      });
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { topResistor, bottomResistor, result: output },
        output,
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setTopResistor({ ...EMPTY_BANDS });
    setBottomResistor({ ...EMPTY_BANDS });
    setResult(null);
    resetSolverState();
  };

  const disabled = isLoading || isSolved;
  const canSolve = completeBands(topResistor) && completeBands(bottomResistor);

  return (
    <SolverLayout>
      <SolverSection
        title="Resistor bands"
        description="Read the three value bands from the end opposite the separated tolerance band."
      >
        <div className="space-y-3">
          <ResistorBandsInput
            title="Top resistor"
            bands={topResistor}
            disabled={disabled}
            onChange={setTopResistor}
          />
          <ResistorBandsInput
            title="Bottom resistor"
            bands={bottomResistor}
            disabled={disabled}
            onChange={setBottomResistor}
          />
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Required wiring" className="border-emerald-500/40">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Target</div>
              <div className="font-mono text-lg font-bold text-foreground">
                {formatResistance(result.targetResistanceOhms)}
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Top</div>
              <div className="font-mono text-lg font-bold text-foreground">
                {formatResistance(result.topResistanceOhms)}
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Bottom</div>
              <div className="font-mono text-lg font-bold text-foreground">
                {formatResistance(result.bottomResistanceOhms)}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {result.requiredConnections.map((connection, index) => (
              <div
                key={`${connection.inputPin}-${connection.outputPin}-${index}`}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2"
              >
                <div className="font-mono text-sm font-bold text-foreground">
                  {routeLabel(connection.inputPin, connection.outputPin, connection.path)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {PATH_LABELS[connection.path]} · {formatResistance(connection.resistanceOhms)}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{result.instruction}</p>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>
        Make only the listed connections, leave every other input/output pair disconnected, then
        press CHECK. Resistor direction does not matter.
      </SolverInstructions>
    </SolverLayout>
  );
}
