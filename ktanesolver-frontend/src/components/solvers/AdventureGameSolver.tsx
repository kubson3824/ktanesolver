import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveAdventureGame,
  type AdventureGameOutput,
  type AdventureGameInput,
} from "../../services/adventureGameService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

const ENEMIES = ["Demon", "Dragon", "Eagle", "Goblin", "Golem", "Troll", "Lizard", "Wizard"];
const WEAPONS = ["Broadsword", "Caber", "Nasty Knife", "Longbow", "Magic orb", "Grimoire"];
const MISC_ITEMS = [
  "Balloon", "Battery", "Bellows", "Cheat code", "Crystal ball", "Feather",
  "Hard drive", "Lamp", "Moonstone", "Potion", "Small dog", "Stepladder",
  "Sunstone", "Symbol", "Ticket", "Trophy",
];

interface AdventureGameSolverProps {
  bomb: BombEntity | null | undefined;
}

const defaultWeapons = (): [string, string, string] => ["", "", ""];
const defaultMiscItems = (): [string, string, string, string, string] => ["", "", "", "", ""];

export default function AdventureGameSolver({ bomb }: AdventureGameSolverProps) {
  const [enemy, setEnemy] = useState("");
  const [str, setStr] = useState(0);
  const [dex, setDex] = useState(0);
  const [intelligence, setIntelligence] = useState(0);
  const [heightFeet, setHeightFeet] = useState(0);
  const [heightInches, setHeightInches] = useState(0);
  const [temperatureCelsius, setTemperatureCelsius] = useState(0);
  const [gravityMs2, setGravityMs2] = useState(9.8);
  const [pressureKpa, setPressureKpa] = useState(101);
  const [weapons, setWeapons] = useState<[string, string, string]>(() => defaultWeapons());
  const [miscItems, setMiscItems] = useState<[string, string, string, string, string]>(() => defaultMiscItems());
  const [result, setResult] = useState<AdventureGameOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const [statsAfterItems, setStatsAfterItems] = useState(false);
  const [potionUsedFirst, setPotionUsedFirst] = useState(false);

  const {
    isLoading,
    error,
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
    () => ({
      enemy,
      str,
      dex,
      intelligence,
      heightFeet,
      heightInches,
      temperatureCelsius,
      gravityMs2,
      pressureKpa,
      weapons,
      miscItems,
      result,
      twitchCommand,
      statsAfterItems,
      potionUsedFirst,
    }),
    [
      enemy,
      str,
      dex,
      intelligence,
      heightFeet,
      heightInches,
      temperatureCelsius,
      gravityMs2,
      pressureKpa,
      weapons,
      miscItems,
      result,
      twitchCommand,
      statsAfterItems,
      potionUsedFirst,
    ]
  );

  const onRestoreState = useCallback(
    (state: {
      enemy?: string;
      str?: number;
      dex?: number;
      intelligence?: number;
      heightFeet?: number;
      heightInches?: number;
      temperatureCelsius?: number;
      gravityMs2?: number;
      pressureKpa?: number;
      weapons?: [string, string, string];
      miscItems?: [string, string, string, string, string];
      result?: AdventureGameOutput | null;
      twitchCommand?: string;
      statsAfterItems?: boolean;
      potionUsedFirst?: boolean;
      input?: AdventureGameInput;
    }) => {
      if (state.enemy !== undefined) setEnemy(state.enemy);
      else if (state.input?.enemy !== undefined) setEnemy(state.input.enemy);
      if (state.str !== undefined) setStr(state.str);
      else if (state.input?.str !== undefined) setStr(state.input.str);
      if (state.dex !== undefined) setDex(state.dex);
      else if (state.input?.dex !== undefined) setDex(state.input.dex);
      if (state.intelligence !== undefined) setIntelligence(state.intelligence);
      else if (state.input?.intelligence !== undefined) setIntelligence(state.input.intelligence);
      if (state.heightFeet !== undefined) setHeightFeet(state.heightFeet);
      else if (state.input?.heightFeet !== undefined) setHeightFeet(state.input.heightFeet);
      if (state.heightInches !== undefined) setHeightInches(state.heightInches);
      else if (state.input?.heightInches !== undefined) setHeightInches(state.input.heightInches);
      if (state.temperatureCelsius !== undefined) setTemperatureCelsius(state.temperatureCelsius);
      else if (state.input?.temperatureCelsius !== undefined) setTemperatureCelsius(state.input.temperatureCelsius);
      if (state.gravityMs2 !== undefined) setGravityMs2(state.gravityMs2);
      else if (state.input?.gravityMs2 !== undefined) setGravityMs2(state.input.gravityMs2);
      if (state.pressureKpa !== undefined) setPressureKpa(state.pressureKpa);
      else if (state.input?.pressureKpa !== undefined) setPressureKpa(state.input.pressureKpa);
      if (state.weapons?.length === 3) setWeapons(state.weapons);
      else if (state.input?.weapons?.length === 3) setWeapons([state.input.weapons[0], state.input.weapons[1], state.input.weapons[2]]);
      if (state.miscItems?.length === 5) setMiscItems(state.miscItems);
      else if (state.input?.miscItems?.length === 5) setMiscItems([state.input.miscItems[0], state.input.miscItems[1], state.input.miscItems[2], state.input.miscItems[3], state.input.miscItems[4]]);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      if (state.statsAfterItems !== undefined) setStatsAfterItems(state.statsAfterItems);
      else if (state.input?.itemsAlreadyUsed !== undefined) setStatsAfterItems(state.input.itemsAlreadyUsed);
      if (state.potionUsedFirst !== undefined) setPotionUsedFirst(state.potionUsedFirst);
      else if (state.input?.potionUsedFirst !== undefined) setPotionUsedFirst(state.input.potionUsedFirst);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: AdventureGameOutput) => {
    if (solution != null) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.ADVENTURE_GAME,
          result: { itemsToUse: solution.itemsToUse, weaponToUse: solution.weaponToUse },
        })
      );
    }
  }, []);

  useSolverModulePersistence<
    typeof moduleState,
    AdventureGameOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const o = raw as { itemsToUse?: unknown; weaponToUse?: string };
      if (!Array.isArray(o.itemsToUse) || typeof o.weaponToUse !== "string") return null;
      return o as AdventureGameOutput;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const buildInput = useCallback((): AdventureGameInput => ({
    enemy: enemy.trim() || ENEMIES[0],
    str: Number(str) || 0,
    dex: Number(dex) || 0,
    intelligence: Number(intelligence) || 0,
    heightFeet: Number(heightFeet) || 0,
    heightInches: Number(heightInches) || 0,
    temperatureCelsius: Number(temperatureCelsius) || 0,
    gravityMs2: Number(gravityMs2) || 9.8,
    pressureKpa: Number(pressureKpa) || 101,
    weapons: weapons.filter(Boolean).length === 3 ? weapons as [string, string, string] : [weapons[0] || WEAPONS[0], weapons[1] || WEAPONS[1], weapons[2] || WEAPONS[2]],
    miscItems: miscItems.filter(Boolean).length === 5 ? miscItems as [string, string, string, string, string] : miscItems.map((v, i) => v || MISC_ITEMS[i]) as [string, string, string, string, string],
    itemsAlreadyUsed: statsAfterItems || undefined,
    potionUsedFirst: potionUsedFirst, // always send so backend receives true when "Potion first" is checked
  }), [enemy, str, dex, intelligence, heightFeet, heightInches, temperatureCelsius, gravityMs2, pressureKpa, weapons, miscItems, statsAfterItems, potionUsedFirst]);

  const handleSolve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    const input = buildInput();
    if (!ENEMIES.includes(input.enemy)) {
      setError("Select an enemy.");
      return;
    }
    if (input.weapons.some((w) => !w || !WEAPONS.includes(w))) {
      setError("Select exactly 3 weapons from the list.");
      return;
    }
    if (!statsAfterItems && input.miscItems.some((m) => !m || !MISC_ITEMS.includes(m))) {
      setError("Select exactly 5 miscellaneous items from the list.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveAdventureGame(round.id, bomb.id, currentModule.id, { input });
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.ADVENTURE_GAME,
        result: { itemsToUse: output.itemsToUse, weaponToUse: output.weaponToUse },
      });
      setTwitchCommand(command);
      updateModuleAfterSolve(bomb.id, currentModule.id, moduleState, output, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, buildInput, moduleState, setIsLoading, clearError, setIsSolved, markModuleSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setEnemy("");
    setStr(0);
    setDex(0);
    setIntelligence(0);
    setHeightFeet(0);
    setHeightInches(0);
    setTemperatureCelsius(0);
    setGravityMs2(9.8);
    setPressureKpa(101);
    setWeapons(defaultWeapons());
    setMiscItems(defaultMiscItems());
    setResult(null);
    setTwitchCommand("");
    setStatsAfterItems(false);
    setPotionUsedFirst(false);
    resetSolverState();
  }, [resetSolverState]);

  const canSolve = useMemo(() => {
    if (!enemy.trim() || !ENEMIES.includes(enemy.trim())) return false;
    if (weapons.filter(Boolean).length !== 3 || weapons.some((w) => !WEAPONS.includes(w))) return false;
    if (!statsAfterItems && (miscItems.filter(Boolean).length !== 5 || miscItems.some((m) => !MISC_ITEMS.includes(m)))) return false;
    return true;
  }, [enemy, weapons, miscItems, statsAfterItems]);

  const inputClass = "w-full rounded-lg bg-neutral-800 border border-neutral-600 text-neutral-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-70";
  const labelClass = "block text-sm text-neutral-400 mb-1";

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100 space-y-4">
        <p className="text-sm text-neutral-300">
          Enter enemy, player stats, world stats, and your 3 weapons + 5 items. Use the manual item table; all applicable items must be used before the weapon.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Enemy</label>
            <select
              value={enemy}
              onChange={(e) => setEnemy(e.target.value)}
              disabled={isLoading}
              className={inputClass}
            >
              <option value="">Select enemy</option>
              {ENEMIES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>STR</label>
            <input type="number" min={0} value={str || ""} onChange={(e) => setStr(Number(e.target.value) || 0)} disabled={isLoading} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>DEX</label>
            <input type="number" min={0} value={dex || ""} onChange={(e) => setDex(Number(e.target.value) || 0)} disabled={isLoading} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>INT</label>
            <input type="number" min={0} value={intelligence || ""} onChange={(e) => setIntelligence(Number(e.target.value) || 0)} disabled={isLoading} className={inputClass} />
          </div>
        </div>

        <div className="space-y-2 text-sm text-neutral-300">
          <p className="text-neutral-400 font-medium">Potion strategy</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={potionUsedFirst}
              onChange={(e) => {
                setPotionUsedFirst(e.target.checked);
                if (e.target.checked) setStatsAfterItems(false);
              }}
              disabled={isLoading}
              className="rounded border-neutral-500"
            />
            <span>I used Potion first — these stats are after Potion (reevaluate other items + weapon)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={statsAfterItems}
              onChange={(e) => {
                setStatsAfterItems(e.target.checked);
                if (e.target.checked) setPotionUsedFirst(false);
              }}
              disabled={isLoading}
              className="rounded border-neutral-500"
            />
            <span>Stats are after using all items — only weapon will be computed</span>
          </label>
          <p className="text-xs text-neutral-500">Default: use other items first, then Potion last. Weapon uses current stats; if Potion changed them, use one of the options above and solve again.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>Height (ft)</label>
            <input type="number" min={0} value={heightFeet || ""} onChange={(e) => setHeightFeet(Number(e.target.value) || 0)} disabled={isLoading} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Height (in)</label>
            <input type="number" min={0} max={11} value={heightInches || ""} onChange={(e) => setHeightInches(Number(e.target.value) || 0)} disabled={isLoading} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Temp (°C)</label>
            <input type="number" step={0.1} value={temperatureCelsius || ""} onChange={(e) => setTemperatureCelsius(Number(e.target.value) || 0)} disabled={isLoading} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Gravity (m/s²)</label>
            <input type="number" step={0.1} value={gravityMs2 || ""} onChange={(e) => setGravityMs2(Number(e.target.value) || 9.8)} disabled={isLoading} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Pressure (kPa)</label>
            <input type="number" step={0.1} value={pressureKpa || ""} onChange={(e) => setPressureKpa(Number(e.target.value) || 101)} disabled={isLoading} className={inputClass} />
          </div>
        </div>

        <div>
          <span className={labelClass}>Weapons (3)</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
            {[0, 1, 2].map((i) => (
              <select
                key={i}
                value={weapons[i]}
                onChange={(e) => setWeapons((prev) => {
                  const next = [...prev] as [string, string, string];
                  next[i] = e.target.value;
                  return next;
                })}
                disabled={isLoading}
                className={inputClass}
              >
                <option value="">Weapon {i + 1}</option>
                {WEAPONS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClass}>Misc items (5)</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <select
                key={i}
                value={miscItems[i]}
                onChange={(e) => setMiscItems((prev) => {
                  const next = [...prev] as [string, string, string, string, string];
                  next[i] = e.target.value;
                  return next;
                })}
                disabled={isLoading}
                className={inputClass}
              >
                <option value="">Item {i + 1}</option>
                {MISC_ITEMS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <ErrorAlert error={error ?? ""} />

        {result && (
          <div className="space-y-2 mt-4 p-4 rounded-lg bg-neutral-800/80">
            {result.itemsToUse.length > 0 && (
              <p className="font-medium text-amber-400">
                Use these items (in any order): <strong>{result.itemsToUse.join(", ")}</strong>
              </p>
            )}
            {result.itemsToUse.includes("Potion") && (
              <p className="text-sm text-amber-300/90 mt-2">
                Potion is last. If your STR/DEX/INT changed after using it: use &quot;I used Potion first&quot; and new stats to get other items + weapon, or &quot;Stats are after using all items&quot; to get weapon only.
              </p>
            )}
            <p className="font-medium text-amber-400">
              {result.itemsToUse.length > 0 ? "Then use weapon" : "Use weapon"}: <strong>{result.weaponToUse}</strong>
            </p>
          </div>
        )}

        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={!canSolve}
          isLoading={isLoading}
        />
        <TwitchCommandDisplay command={twitchCommand} />
      </div>
    </SolverLayout>
  );
}
