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
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
} from "../common";
import { Alert } from "../ui/alert";

interface AstrologySolverProps {
  bomb: BombEntity | null | undefined;
}

const ELEMENT_OPTIONS: AstrologyElementType[] = ["FIRE", "WATER", "EARTH", "AIR"];
const PLANET_OPTIONS: AstrologyPlanetType[] = [
  "SUN",
  "MOON",
  "MERCURY",
  "VENUS",
  "MARS",
  "JUPITER",
  "SATURN",
  "URANUS",
  "NEPTUNE",
  "PLUTO",
];
const ZODIAC_OPTIONS: AstrologyZodiacType[] = [
  "ARIES",
  "TAURUS",
  "GEMINI",
  "CANCER",
  "LEO",
  "VIRGO",
  "LIBRA",
  "SCORPIO",
  "SAGITTARIUS",
  "CAPRICORN",
  "AQUARIUS",
  "PISCES",
];

const ELEMENT_GLYPH: Record<AstrologyElementType, string> = {
  FIRE: "\u{1F525}",
  WATER: "\u{1F4A7}",
  EARTH: "\u{1F30D}",
  AIR: "\u{1F32C}",
};

const ZODIAC_GLYPH: Record<AstrologyZodiacType, string> = {
  ARIES: "\u2648",
  TAURUS: "\u2649",
  GEMINI: "\u264A",
  CANCER: "\u264B",
  LEO: "\u264C",
  VIRGO: "\u264D",
  LIBRA: "\u264E",
  SCORPIO: "\u264F",
  SAGITTARIUS: "\u2650",
  CAPRICORN: "\u2651",
  AQUARIUS: "\u2652",
  PISCES: "\u2653",
};

const PLANET_GLYPH: Record<AstrologyPlanetType, string> = {
  SUN: "\u2609",
  MOON: "\u263D",
  MERCURY: "\u263F",
  VENUS: "\u2640",
  MARS: "\u2642",
  JUPITER: "\u2643",
  SATURN: "\u2644",
  URANUS: "\u2645",
  NEPTUNE: "\u2646",
  PLUTO: "\u2647",
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

function SymbolButton({
  kind,
  value,
  glyph,
  selected,
  disabled,
  imagePrefix,
  onSelect,
}: SymbolButtonProps) {
  const label = prettify(value);
  const [imageFailed, setImageFailed] = useState(false);

  const accent =
    kind === "element"
      ? "from-orange-500/30 to-amber-500/10 ring-orange-400"
      : kind === "planet"
        ? "from-sky-500/30 to-indigo-500/10 ring-sky-400"
        : "from-fuchsia-500/30 to-purple-500/10 ring-fuchsia-400";

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onSelect}
      className={`group relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border p-2 transition-all duration-150
        ${
          selected
            ? `border-transparent bg-gradient-to-br ${accent} ring-2 shadow-lg shadow-black/30 scale-[1.02]`
            : "border-gray-700 bg-gray-900/60 hover:border-gray-500 hover:bg-gray-900"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex h-12 w-full items-center justify-center">
        {imageFailed ? (
          <span className="text-3xl leading-none" aria-hidden>
            {glyph}
          </span>
        ) : (
          <img
            src={astrologyImageUrl(imagePrefix, value)}
            alt=""
            aria-hidden
            className="max-h-12 w-auto object-contain drop-shadow"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <span
        className={`w-full text-center text-[10px] font-medium uppercase leading-tight break-words ${
          selected ? "text-white" : "text-gray-400 group-hover:text-gray-200"
        }`}
      >
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

  const omenAlertVariant =
    omenKind === "good" ? "success" : omenKind === "poor" ? "destructive" : "warning";

  const omenButton =
    omenKind === "good" ? "GOOD OMEN" : omenKind === "poor" ? "POOR OMEN" : "NO OMEN";

  const digitList = uniqueOmenDigits.join(", ");
  const digitVerb = uniqueOmenDigits.length === 1 ? "is" : "are";

  return (
    <SolverLayout>
      <div className="relative overflow-hidden rounded-lg border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 mb-4 shadow-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 80%, #fff, transparent), radial-gradient(1px 1px at 85% 20%, #fff, transparent), radial-gradient(1px 1px at 10% 75%, #fff, transparent)",
          }}
          aria-hidden
        />

        <div className="relative">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">
              Astrology Module
            </h3>
            <div className="text-xs text-indigo-300/70">
              {element && planet && zodiac ? "Ready to solve" : "Pick 3 symbols"}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                  Element
                </label>
                <span className="text-xs text-gray-400">
                  {element ? prettify(element) : "—"}
                </span>
              </div>
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
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                  Planet
                </label>
                <span className="text-xs text-gray-400">
                  {planet ? prettify(planet) : "—"}
                </span>
              </div>
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
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
                  Zodiac
                </label>
                <span className="text-xs text-gray-400">
                  {zodiac ? prettify(zodiac) : "—"}
                </span>
              </div>
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
            </div>
          </div>
        </div>
      </div>

      <SolverControls
        onSolve={solveModule}
        onReset={reset}
        isSolveDisabled={isSolveDisabled}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result != null && typeof result.omenScore === "number" && (
        <Alert variant={omenAlertVariant} className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                Omen Score
              </div>
              <div className="font-mono text-3xl font-bold leading-tight">
                {result.omenScore > 0 ? `+${result.omenScore}` : result.omenScore}
              </div>
            </div>
            <div className="rounded-md border border-current px-3 py-1 text-sm font-bold">
              {omenButton}
            </div>
          </div>
          <div className="mt-3 text-sm">
            {omenKind === "none" ? (
              <span>
                Press <span className="font-bold">NO OMEN</span> at any time.
              </span>
            ) : (
              <span>
                Press <span className="font-bold">{omenButton}</span> anytime{" "}
                <span className="font-mono font-semibold">{digitList}</span> {digitVerb} a digit in
                the timer.
              </span>
            )}
          </div>
        </Alert>
      )}

      {result != null && typeof result.omenScore === "number" && twitchCommand && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select the element, planet, and zodiac shown on the module.</p>
        <p>The solver will compute the omen score based on those symbols and your bomb serial number.</p>
      </div>
    </SolverLayout>
  );
}
