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

const astrologyImageUrl = (prefix: "e" | "p" | "a", value: string) =>
  `https://ktane.timwi.de/HTML/img/Astrology/${prefix}_${value.toLowerCase()}.png`;

const prettify = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");

export default function AstrologySolver({ bomb }: AstrologySolverProps) {
  const [element, setElement] = useState<AstrologyElementType | "">("");
  const [planet, setPlanet] = useState<AstrologyPlanetType | "">("");
  const [zodiac, setZodiac] = useState<AstrologyZodiacType | "">("");
  const [result, setResult] = useState<AstrologyOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const omenScoreDigits = useMemo(() => {
    if (!result) return [] as string[];
    const abs = Math.abs(result.omenScore);
    return String(abs)
      .split("")
      .filter((c) => /\d/.test(c));
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
      input?: { element?: AstrologyElementType | ""; planet?: AstrologyPlanetType | ""; zodiac?: AstrologyZodiacType | "" };
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

  const onRestoreSolution = useCallback(
    (solution: AstrologyOutput) => {
      if (!solution || typeof (solution as AstrologyOutput).omenScore !== "number") return;
      setResult(solution);

      const command = generateTwitchCommand({
        moduleType: ModuleType.ASTROLOGY,
        result: { omenScore: solution.omenScore },
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { element: AstrologyElementType | ""; planet: AstrologyPlanetType | ""; zodiac: AstrologyZodiacType | ""; result: AstrologyOutput | null; twitchCommand: string },
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
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const isSolveDisabled = useMemo(() => {
    return !element || !planet || !zodiac;
  }, [element, planet, zodiac]);

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

  return (
    <SolverLayout>
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">ASTROLOGY MODULE</h3>

        <div className="grid gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Element</label>
            <div className="grid grid-cols-4 gap-2">
              {ELEMENT_OPTIONS.map((opt) => {
                const selected = element === opt;
                const disabled = isLoading || isSolved;

                return (
                  <button
                    key={opt}
                    type="button"
                    className={`rounded-lg border p-2 bg-gray-900 transition-colors ${
                      selected ? "border-primary" : "border-gray-700"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-gray-500"}`}
                    onClick={() => {
                      if (disabled) return;
                      setElement(opt);
                      clearError();
                    }}
                    aria-label={prettify(opt)}
                    disabled={disabled}
                  >
                    <img
                      src={astrologyImageUrl("e", opt)}
                      alt={prettify(opt)}
                      className="w-full h-auto max-h-16 object-contain"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Planet</label>
            <div className="grid grid-cols-5 gap-2">
              {PLANET_OPTIONS.map((opt) => {
                const selected = planet === opt;
                const disabled = isLoading || isSolved;

                return (
                  <button
                    key={opt}
                    type="button"
                    className={`rounded-lg border p-2 bg-gray-900 transition-colors ${
                      selected ? "border-primary" : "border-gray-700"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-gray-500"}`}
                    onClick={() => {
                      if (disabled) return;
                      setPlanet(opt);
                      clearError();
                    }}
                    aria-label={prettify(opt)}
                    disabled={disabled}
                  >
                    <img
                      src={astrologyImageUrl("p", opt)}
                      alt={prettify(opt)}
                      className="w-full h-auto max-h-16 object-contain"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Zodiac</label>
            <div className="grid grid-cols-6 gap-2">
              {ZODIAC_OPTIONS.map((opt) => {
                const selected = zodiac === opt;
                const disabled = isLoading || isSolved;

                return (
                  <button
                    key={opt}
                    type="button"
                    className={`rounded-lg border p-2 bg-gray-900 transition-colors ${
                      selected ? "border-primary" : "border-gray-700"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-gray-500"}`}
                    onClick={() => {
                      if (disabled) return;
                      setZodiac(opt);
                      clearError();
                    }}
                    aria-label={prettify(opt)}
                    disabled={disabled}
                  >
                    <img
                      src={astrologyImageUrl("a", opt)}
                      alt={prettify(opt)}
                      className="w-full h-auto max-h-14 object-contain"
                      loading="lazy"
                    />
                  </button>
                );
              })}
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
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span className="font-bold">Omen score:</span>
            <div className="mt-1 font-mono text-2xl">{result.omenScore}</div>
            <div className="mt-2">
              {result.omenScore === 0 ? (
                <span>
                  Press <span className="font-bold">NO OMEN</span>.
                </span>
              ) : result.omenScore > 0 ? (
                <span>
                  Press <span className="font-bold">GOOD OMEN</span> anytime {" "}
                  <span className="font-mono">{omenScoreDigits.join(", ")}</span> is a digit in the timer.
                </span>
              ) : (
                <span>
                  Press <span className="font-bold">POOR OMEN</span> anytime {" "}
                  <span className="font-mono">{omenScoreDigits.join(", ")}</span> is a digit in the timer.
                </span>
              )}
            </div>
          </div>
        </div>
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
