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
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Alert } from "../ui/alert";

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
  NON_CHLORINE_BLEACH: {
    label: "Non-chlorine bleach",
    fileName: "non-chlorine bleach.png",
  },
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
  NO_STEAM_FINISHING: {
    label: "No steam finishing",
    fileName: "no steam finishing.png",
  },
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
    <svg viewBox="0 0 64 64" className="w-16 h-16 text-sky-100" aria-hidden>
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
    <div className="rounded-lg border border-neutral-600 bg-neutral-800/80 p-4 flex flex-col items-center justify-center min-h-36">
      <span className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-3">
        {title}
      </span>
      {!definition ? (
        <div className="w-16 h-16 rounded border border-dashed border-neutral-600" />
      ) : definition.custom === "circleTopLeft" ? (
        <CircleTopLeftSymbol />
      ) : (
        <img
          src={laundryImageUrl(definition.fileName!)}
          alt={definition.label}
          className="w-16 h-16 object-contain"
          loading="lazy"
        />
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
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100">
        <p className="text-sm text-neutral-300 mb-4">
          Laundry is fully automatic here. The solver uses the bomb&apos;s live edgework plus
          current solved and unsolved module counts, so solve it when you are ready to insert
          the machine settings on the module.
        </p>

        {result?.bobShortcut ? (
          <div className="rounded-lg border border-emerald-500/60 bg-emerald-950/40 p-6 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-amber-300 bg-neutral-900/80 flex items-center justify-center">
              <div className="w-5 h-10 rounded-full border-2 border-amber-300" />
            </div>
            <p className="text-lg font-semibold text-emerald-200">Insert the coin.</p>
            <p className="text-sm text-emerald-100/80 mt-2">
              Lit BOB with exactly 4 batteries in 2 holders overrides all other Laundry rules.
            </p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LaundrySymbolSlot title="Top Left" symbol={result.washingSymbol} />
              <LaundrySymbolSlot title="Top Right" symbol={result.dryingSymbol} />
              <LaundrySymbolSlot title="Top Display" symbol={result.ironingSymbol} />
              <LaundrySymbolSlot title="Bottom Display" symbol={result.specialSymbol} />
            </div>
            <p className="text-center text-xs text-neutral-400 uppercase tracking-wide">
              {ITEM_LABELS[result.item]} / {MATERIAL_LABELS[result.material]} / {COLOR_LABELS[result.color]}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LaundrySymbolSlot title="Top Left" symbol={null} />
            <LaundrySymbolSlot title="Top Right" symbol={null} />
            <LaundrySymbolSlot title="Top Display" symbol={null} />
            <LaundrySymbolSlot title="Bottom Display" symbol={null} />
          </div>
        )}
      </div>

      <div className="mt-6">
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={false}
          isLoading={isLoading}
          isSolved={isSolved}
          solveText="Solve"
        />
      </div>

      <ErrorAlert error={error} />

      {result?.bobShortcut && (
        <Alert variant="success" className="mb-4">
          <p className="font-bold">BOB did the work.</p>
          <p className="text-sm mt-1">Insert the coin immediately; no laundry symbols are needed.</p>
        </Alert>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
