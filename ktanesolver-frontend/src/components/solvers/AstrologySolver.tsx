import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveAstrology,
  type AstrologyElementType,
  type AstrologyInput,
  type AstrologyOutput,
  type AstrologyPlanetType,
  type AstrologyZodiacType,
} from "../../services/astrologyService";
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
import { cn } from "../../lib/cn";

interface AstrologySolverProps {
  bomb: BombEntity | null | undefined;
}

const ELEMENT_OPTIONS: AstrologyElementType[] = ["FIRE", "WATER", "EARTH", "AIR"];
const PLANET_OPTIONS: AstrologyPlanetType[] = [
  "SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO",
];
const ZODIAC_OPTIONS: AstrologyZodiacType[] = [
  "ARIES", "TAURUS", "GEMINI", "CANCER", "LEO", "VIRGO",
  "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES",
];

const ELEMENT_GLYPH: Record<AstrologyElementType, string> = {
  FIRE: "\u{1F525}",
  WATER: "\u{1F4A7}",
  EARTH: "\u{1F30D}",
  AIR: "\u{1F32C}",
};

const ZODIAC_GLYPH: Record<AstrologyZodiacType, string> = {
  ARIES: "\u2648", TAURUS: "\u2649", GEMINI: "\u264A", CANCER: "\u264B",
  LEO: "\u264C", VIRGO: "\u264D", LIBRA: "\u264E", SCORPIO: "\u264F",
  SAGITTARIUS: "\u2650", CAPRICORN: "\u2651", AQUARIUS: "\u2652", PISCES: "\u2653",
};

const PLANET_GLYPH: Record<AstrologyPlanetType, string> = {
  SUN: "\u2609", MOON: "\u263D", MERCURY: "\u263F", VENUS: "\u2640",
  MARS: "\u2642", JUPITER: "\u2643", SATURN: "\u2644", URANUS: "\u2645",
  NEPTUNE: "\u2646", PLUTO: "\u2647",
};

const astrologyImageUrl = (prefix: "e" | "p" | "a", value: string) =>
  `https://ktane.timwi.de/HTML/img/Astrology/${prefix}_${value.toLowerCase()}.png`;

const prettify = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");

type SymbolKind = "element" | "planet" | "zodiac";

interface SymbolButtonProps {
  kind: SymbolKind;
  value: string;
  glyph: string;
  selected: boolean;
  disabled: boolean;
  imagePrefix: "e" | "p" | "a";
  onSelect: () => void;
}

function SymbolButton({ value, glyph, selected, disabled, imagePrefix, onSelect }: SymbolButtonProps) {
  const label = prettify(value);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 transition-colors",
        selected
          ? "border-ring bg-accent/15 text-foreground ring-2 ring-ring ring-offset-1 ring-offset-card"
          : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
        disabled && !selected && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex h-12 w-full items-center justify-center">
        {imageFailed ? (
          <span className="text-3xl leading-none" aria-hidden>{glyph}</span>
        ) : (
          <img
            src={astrologyImageUrl(imagePrefix, value)}
            alt=""
            aria-hidden
            className="max-h-12 w-auto object-contain"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <span className="w-full break-words text-center text-[0.65rem] font-medium uppercase leading-tight">
        {label}
      </span>
    </button>
  );
}

export default function AstrologySolver({ bomb }: AstrologySolverProps) {
  const [element, setElement] = useState<AstrologyElementType | "">("");
  const [planet, setPlanet] = useState<AstrologyPlanetType | "">("");
  const [zodiac, setZodiac] = useState<AstrologyZodiacType | "">("");
  const [result, setResult] = useState<AstrologyOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const uniqueOmenDigits = useMemo(() => {
    if (!result) return [] as string[];
    const abs = Math.abs(result.omenScore);
    const digits = String(abs).split("").filter((c) => /\d/.test(c));
    return Array.from(new Set(digits));
  }, [result]);

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
    () => ({ element, planet, zodiac, result, twitchCommand }),
    [element, planet, zodiac, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      element?: AstrologyElementType | "";
      planet?: AstrologyPlanetType | "";
      zodiac?: AstrologyZodiacType | "";
      input?: {
        element?: AstrologyElementType | "";
        planet?: AstrologyPlanetType | "";
        zodiac?: AstrologyZodiacType | "";
      };
    }) => {
      const el = state.input?.element ?? state.element;
      const pl = state.input?.planet ?? state.planet;
      const zo = state.input?.zodiac ?? state.zodiac;
      if (el !== undefined) setElement(el);
      if (pl !== undefined) setPlanet(pl);
      if (zo !== undefined) setZodiac(zo);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: AstrologyOutput) => {
    if (!solution || typeof (solution as AstrologyOutput).omenScore !== "number") return;
    setResult(solution);
    const command = generateTwitchCommand({
      moduleType: ModuleType.ASTROLOGY,
      result: { omenScore: solution.omenScore },
    });
    setTwitchCommand(command);
  }, []);

  useSolverModulePersistence<
    {
      element: AstrologyElementType | "";
      planet: AstrologyPlanetType | "";
      zodiac: AstrologyZodiacType | "";
      result: AstrologyOutput | null;
      twitchCommand: string;
    },
    AstrologyOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown; omenScore?: unknown };
        let parsed: AstrologyOutput | null = null;
        if (anyRaw.output && typeof anyRaw.output === "object") parsed = anyRaw.output as AstrologyOutput;
        else if (anyRaw.result && typeof anyRaw.result === "object") parsed = anyRaw.result as AstrologyOutput;
        else if (typeof (raw as AstrologyOutput).omenScore === "number") parsed = raw as AstrologyOutput;
        if (parsed != null && typeof parsed.omenScore === "number") return parsed;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const isSolveDisabled = useMemo(() => !element || !planet || !zodiac, [element, planet, zodiac]);

  const solveModule = async () => {
    if (!element || !planet || !zodiac) {
      setError("Please select an element, planet, and zodiac");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: AstrologyInput = { element, planet, zodiac };
      const response = await solveAstrology(round.id, bomb.id, currentModule.id, { input });

      setResult(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.ASTROLOGY,
        result: response.output,
      });
      setTwitchCommand(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Astrology");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setElement("");
    setPlanet("");
    setZodiac("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const controlsDisabled = isLoading || isSolved;

  const omenKind: "good" | "poor" | "none" | null =
    result == null
      ? null
      : result.omenScore > 0
        ? "good"
        : result.omenScore < 0
          ? "poor"
          : "none";

  const omenVariant: "success" | "warning" | "info" =
    omenKind === "good" ? "success" : omenKind === "poor" ? "warning" : "info";

  const omenButton =
    omenKind === "good" ? "GOOD OMEN" : omenKind === "poor" ? "POOR OMEN" : "NO OMEN";

  const digitList = uniqueOmenDigits.join(", ");
  const digitVerb = uniqueOmenDigits.length === 1 ? "is" : "are";

  return (
    <SolverLayout>
      <SolverSection
        title="Element"
        description={element ? prettify(element) : "Pick the element shown on the module."}
      >
        <div className="grid grid-cols-4 gap-2">
          {ELEMENT_OPTIONS.map((opt) => (
            <SymbolButton
              key={opt}
              kind="element"
              value={opt}
              glyph={ELEMENT_GLYPH[opt]}
              selected={element === opt}
              disabled={controlsDisabled}
              imagePrefix="e"
              onSelect={() => {
                setElement(opt);
                clearError();
              }}
            />
          ))}
        </div>
      </SolverSection>

      <SolverSection
        title="Planet"
        description={planet ? prettify(planet) : "Pick the planet shown on the module."}
      >
        <div className="grid grid-cols-5 gap-2">
          {PLANET_OPTIONS.map((opt) => (
            <SymbolButton
              key={opt}
              kind="planet"
              value={opt}
              glyph={PLANET_GLYPH[opt]}
              selected={planet === opt}
              disabled={controlsDisabled}
              imagePrefix="p"
              onSelect={() => {
                setPlanet(opt);
                clearError();
              }}
            />
          ))}
        </div>
      </SolverSection>

      <SolverSection
        title="Zodiac"
        description={zodiac ? prettify(zodiac) : "Pick the zodiac sign shown on the module."}
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {ZODIAC_OPTIONS.map((opt) => (
            <SymbolButton
              key={opt}
              kind="zodiac"
              value={opt}
              glyph={ZODIAC_GLYPH[opt]}
              selected={zodiac === opt}
              disabled={controlsDisabled}
              imagePrefix="a"
              onSelect={() => {
                setZodiac(opt);
                clearError();
              }}
            />
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={solveModule}
        onReset={reset}
        isSolveDisabled={isSolveDisabled}
        isLoading={isLoading}
        isSolved={isSolved}
      />

      <ErrorAlert error={error} />

      {result != null && typeof result.omenScore === "number" && (
        <SolverResult
          variant={omenVariant}
          title={`${omenButton} (omen score ${result.omenScore > 0 ? `+${result.omenScore}` : result.omenScore})`}
          description={
            omenKind === "none"
              ? "Press NO OMEN at any time."
              : `Press ${omenButton} any time ${digitList} ${digitVerb} a digit in the timer.`
          }
        />
      )}

      {result != null && typeof result.omenScore === "number" && twitchCommand && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <SolverInstructions>
        Pick the element, planet, and zodiac shown on the module. The solver computes the omen
        score from those symbols and your bomb's serial number, then tells you which button to
        press and when.
      </SolverInstructions>
    </SolverLayout>
  );
}
