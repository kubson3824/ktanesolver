import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveLaundry,
  type LaundryOutput,
  type LaundrySymbol,
} from "../../services/laundryService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

type LaundrySymbolDefinition = {
  label: string;
  fileName?: string;
  custom?: "circleTopLeft";
};

const SYMBOL_DEFINITIONS: Record<LaundrySymbol, LaundrySymbolDefinition> = {
  WASH_80F: { label: "80°F wash", fileName: "30°C or 80°F.png" },
  WASH_105F: { label: "105°F wash", fileName: "40°C or 105°F.png" },
  WASH_120F: { label: "120°F wash", fileName: "50°C or 120°F.png" },
  WASH_95F_DOTS: { label: "95°C or 200°F dots", fileName: "95°C or 200°F dots.png" },
  WASH_GENTLE_OR_DELICATE: {
    label: "Gentle or delicate wash",
    fileName: "machine wash gentle or delicate.png",
  },
  HAND_WASH: { label: "Hand wash", fileName: "hand wash.png" },
  DO_NOT_WASH: { label: "Do not wash", fileName: "do not wash.png" },
  TUMBLE_DRY: { label: "Tumble dry", fileName: "tumble dry.png" },
  LOW_HEAT_DRY: { label: "Low heat dry", fileName: "low heat dry.png" },
  MEDIUM_HEAT: { label: "Medium heat", fileName: "medium heat.png" },
  HIGH_HEAT: { label: "High heat", fileName: "high heat.png" },
  NO_HEAT: { label: "No heat", fileName: "no heat.png" },
  HANG_TO_DRY: { label: "Hang to dry", fileName: "hang to dry.png" },
  DRIP_DRY: { label: "Drip dry", fileName: "drip dry.png" },
  DRY_FLAT: { label: "Dry flat", fileName: "dry flat.png" },
  DO_NOT_TUMBLE_DRY: { label: "Do not tumble dry", fileName: "do not tumble dry.png" },
  DRY: { label: "Dry", fileName: "dry.png" },
  IRON: { label: "Iron", fileName: "iron.png" },
  IRON_110C_230F: { label: "Iron at 110°C / 230°F", fileName: "iron at 110°C 230°F.png" },
  IRON_150C_300F: { label: "Iron at 150°C / 300°F", fileName: "iron at 150°C 300°F.png" },
  IRON_200C_390F: { label: "Iron at 200°C / 390°F", fileName: "iron at 200°C 390°F.png" },
  NO_STEAM: { label: "No steam", fileName: "no steam.png" },
  BLEACH: { label: "Bleach", fileName: "bleach.png" },
  DO_NOT_BLEACH: { label: "Do not bleach", fileName: "do not bleach.png" },
  NON_CHLORINE_BLEACH: { label: "Non-chlorine bleach", fileName: "non-chlorine bleach.png" },
  ANY_SOLVENT: { label: "Any solvent", fileName: "any solvent.png" },
  NO_TETRACHLORETHYLENE: {
    label: "Any solvent except tetrachlorethylene",
    fileName: "any solvent except tetrachlorethylene.png",
  },
  PETROLEUM_SOLVENT_ONLY: {
    label: "Petroleum solvent only",
    fileName: "petroleum solvent only.png",
  },
  WET_CLEANING: { label: "Wet cleaning", fileName: "wet cleaning.png" },
  DO_NOT_DRYCLEAN: { label: "Do not dry clean", fileName: "do not dryclean.png" },
  SHORT_CYCLE: { label: "Short cycle", fileName: "short cycle.png" },
  REDUCED_MOISTURE: { label: "Reduced moisture", fileName: "reduced moisture.png" },
  LOW_HEAT: { label: "Low heat", fileName: "low heat.png" },
  NO_STEAM_FINISHING: { label: "No steam finishing", fileName: "no steam finishing.png" },
  CIRCLE_TOP_LEFT: { label: "Circle top left", custom: "circleTopLeft" },
};

const ITEM_LABELS: Record<LaundryOutput["item"], string> = {
  CORSET: "Corset",
  SHIRT: "Shirt",
  SKIRT: "Skirt",
  SKORT: "Skort",
  SHORTS: "Shorts",
  SCARF: "Scarf",
};

const MATERIAL_LABELS: Record<LaundryOutput["material"], string> = {
  POLYESTER: "Polyester",
  COTTON: "Cotton",
  WOOL: "Wool",
  NYLON: "Nylon",
  CORDUROY: "Corduroy",
  LEATHER: "Leather",
};

const COLOR_LABELS: Record<LaundryOutput["color"], string> = {
  RUBY_FOUNTAIN: "Ruby Fountain",
  STAR_LEMON_QUARTZ: "Star Lemon Quartz",
  SAPPHIRE_SPRINGS: "Sapphire Springs",
  JADE_CLUSTER: "Jade Cluster",
  CLOUDED_PEARL: "Clouded Pearl",
  MALINITE: "Malinite",
};

function laundryImageUrl(fileName: string): string {
  return `https://ktane.timwi.de/HTML/img/Laundry/${encodeURIComponent(fileName)}`;
}

function CircleTopLeftSymbol() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-foreground" aria-hidden>
      <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" strokeWidth="4" />
      <line
        x1="10"
        y1="18"
        x2="24"
        y2="6"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LaundrySymbolSlot({
  title,
  symbol,
}: {
  title: string;
  symbol: LaundrySymbol | null;
}) {
  const definition = symbol ? SYMBOL_DEFINITIONS[symbol] : null;

  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-border bg-muted/40 p-4">
      <span className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </span>
      {!definition ? (
        <div className="h-16 w-16 rounded border border-dashed border-border" />
      ) : definition.custom === "circleTopLeft" ? (
        <CircleTopLeftSymbol />
      ) : (
        <img
          src={laundryImageUrl(definition.fileName!)}
          alt={definition.label}
          title={definition.label}
          className="h-16 w-16 object-contain"
          loading="lazy"
        />
      )}
      {definition && (
        <span className="mt-2 text-center text-xs text-foreground">{definition.label}</span>
      )}
    </div>
  );
}

interface LaundrySolverProps {
  bomb: BombEntity | null | undefined;
}

export default function LaundrySolver({ bomb }: LaundrySolverProps) {
  const [result, setResult] = useState<LaundryOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ result, twitchCommand }),
    [result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      result?: LaundryOutput | null;
      twitchCommand?: string;
      bobShortcut?: boolean;
      washingSymbol?: LaundrySymbol | null;
      dryingSymbol?: LaundrySymbol | null;
      ironingSymbol?: LaundrySymbol | null;
      specialSymbol?: LaundrySymbol | null;
      item?: LaundryOutput["item"];
      material?: LaundryOutput["material"];
      color?: LaundryOutput["color"];
    }) => {
      if (state.result !== undefined) {
        setResult(state.result);
      } else if (
        typeof state.bobShortcut === "boolean" &&
        state.item &&
        state.material &&
        state.color
      ) {
        setResult({
          bobShortcut: state.bobShortcut,
          washingSymbol: state.washingSymbol ?? null,
          dryingSymbol: state.dryingSymbol ?? null,
          ironingSymbol: state.ironingSymbol ?? null,
          specialSymbol: state.specialSymbol ?? null,
          item: state.item,
          material: state.material,
          color: state.color,
        });
      }
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: LaundryOutput) => {
    setResult(solution);
    setTwitchCommand(
      generateTwitchCommand({
        moduleType: ModuleType.LAUNDRY,
        result: solution,
      }),
    );
  }, []);

  useSolverModulePersistence<
    { result: LaundryOutput | null; twitchCommand: string },
    LaundryOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const value = raw as Partial<LaundryOutput>;
      if (
        typeof value.bobShortcut === "boolean" &&
        typeof value.item === "string" &&
        typeof value.material === "string" &&
        typeof value.color === "string"
      ) {
        return {
          bobShortcut: value.bobShortcut,
          washingSymbol: value.washingSymbol ?? null,
          dryingSymbol: value.dryingSymbol ?? null,
          ironingSymbol: value.ironingSymbol ?? null,
          specialSymbol: value.specialSymbol ?? null,
          item: value.item,
          material: value.material,
          color: value.color,
        } as LaundryOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveLaundry(round.id, bomb.id, currentModule.id);
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.LAUNDRY,
        result: output,
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { result: output, twitchCommand: command },
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
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Laundry"
        description="Fully automatic — uses the bomb's live edgework plus current solved/unsolved counts. Solve when you're ready to dial in the machine settings."
      >
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isLoading={isLoading}
          isSolved={isSolved}
        />
      </SolverSection>

      <ErrorAlert error={error} />

      {result?.bobShortcut ? (
        <SolverResult
          variant="success"
          title="BOB shortcut — insert the coin"
          description="Lit BOB with exactly 4 batteries in 2 holders overrides all other Laundry rules. No symbols needed."
        />
      ) : result ? (
        <>
          <SolverSection
            title="Set these symbols"
            description={`Item: ${ITEM_LABELS[result.item]} • Material: ${MATERIAL_LABELS[result.material]} • Color: ${COLOR_LABELS[result.color]}`}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LaundrySymbolSlot title="Top Left" symbol={result.washingSymbol} />
              <LaundrySymbolSlot title="Top Right" symbol={result.dryingSymbol} />
              <LaundrySymbolSlot title="Top Display" symbol={result.ironingSymbol} />
              <LaundrySymbolSlot title="Bottom Display" symbol={result.specialSymbol} />
            </div>
          </SolverSection>
        </>
      ) : null}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Press solve when you're ready to enter the laundry settings. The solver reads the bomb's
        current edgework and module state to compute the symbols, item, material, and color to
        dial in. If a BOB shortcut applies, just insert the coin.
      </SolverInstructions>
    </SolverLayout>
  );
}
