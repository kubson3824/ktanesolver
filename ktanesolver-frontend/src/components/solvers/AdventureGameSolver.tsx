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
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

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

const SELECT_CLASS =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

const FieldLabel = ({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-muted-foreground">
    {children}
  </label>
);

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

  useSolverModulePersistence<typeof moduleState, AdventureGameOutput>({
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
    potionUsedFirst: potionUsedFirst,
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
  }, [round?.id, bomb?.id, currentModule?.id, buildInput, moduleState, statsAfterItems, setError, setIsLoading, clearError, setIsSolved, markModuleSolved, updateModuleAfterSolve]);

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

  const formDisabled = isLoading || isSolved;

  const resultDescription = result
    ? [
        result.itemsToUse.length > 0
          ? `Use items (any order): ${result.itemsToUse.join(", ")}`
          : null,
        `${result.itemsToUse.length > 0 ? "Then use weapon" : "Use weapon"}: ${result.weaponToUse}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return (
    <SolverLayout>
      <SolverSection
        title="Enemy"
        description="Pick the creature shown on the module screen."
      >
        <select
          id="adv-enemy"
          value={enemy}
          onChange={(e) => setEnemy(e.target.value)}
          disabled={formDisabled}
          className={SELECT_CLASS}
          aria-label="Enemy"
        >
          <option value="">Select enemy</option>
          {ENEMIES.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </SolverSection>

      <SolverSection
        title="Player stats"
        description="Strength, dexterity, and intelligence shown on the module."
      >
        <div className="grid grid-cols-3 gap-3">
          {(["STR", "DEX", "INT"] as const).map((label, i) => {
            const value = i === 0 ? str : i === 1 ? dex : intelligence;
            const setter = i === 0 ? setStr : i === 1 ? setDex : setIntelligence;
            const id = `adv-${label.toLowerCase()}`;
            return (
              <div key={label}>
                <FieldLabel htmlFor={id}>{label}</FieldLabel>
                <Input
                  id={id}
                  type="number"
                  min={0}
                  value={value || ""}
                  onChange={(e) => setter(Number(e.target.value) || 0)}
                  disabled={formDisabled}
                />
              </div>
            );
          })}
        </div>
      </SolverSection>

      <SolverSection
        title="Potion strategy"
        description="By default the solver assumes Potion is used last. Use one of these toggles only when reevaluating after Potion changed your stats."
      >
        <div className="space-y-2 text-sm">
          <label className={cn("flex cursor-pointer items-start gap-2", formDisabled && "cursor-not-allowed opacity-60")}>
            <input
              type="checkbox"
              checked={potionUsedFirst}
              onChange={(e) => {
                setPotionUsedFirst(e.target.checked);
                if (e.target.checked) setStatsAfterItems(false);
              }}
              disabled={formDisabled}
              className="mt-0.5 h-4 w-4 rounded border-border accent-blue-500"
            />
            <span className="text-foreground">
              I used Potion first — these stats are after Potion (reevaluate other items + weapon)
            </span>
          </label>
          <label className={cn("flex cursor-pointer items-start gap-2", formDisabled && "cursor-not-allowed opacity-60")}>
            <input
              type="checkbox"
              checked={statsAfterItems}
              onChange={(e) => {
                setStatsAfterItems(e.target.checked);
                if (e.target.checked) setPotionUsedFirst(false);
              }}
              disabled={formDisabled}
              className="mt-0.5 h-4 w-4 rounded border-border accent-blue-500"
            />
            <span className="text-foreground">
              Stats are after using all items — only weapon will be computed
            </span>
          </label>
        </div>
      </SolverSection>

      <SolverSection
        title="World stats"
        description="Height, temperature, gravity, and pressure from the bomb context."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <FieldLabel htmlFor="adv-h-ft">Height (ft)</FieldLabel>
            <Input id="adv-h-ft" type="number" min={0} value={heightFeet || ""} onChange={(e) => setHeightFeet(Number(e.target.value) || 0)} disabled={formDisabled} />
          </div>
          <div>
            <FieldLabel htmlFor="adv-h-in">Height (in)</FieldLabel>
            <Input id="adv-h-in" type="number" min={0} max={11} value={heightInches || ""} onChange={(e) => setHeightInches(Number(e.target.value) || 0)} disabled={formDisabled} />
          </div>
          <div>
            <FieldLabel htmlFor="adv-temp">Temp (°C)</FieldLabel>
            <Input id="adv-temp" type="number" step={0.1} value={temperatureCelsius || ""} onChange={(e) => setTemperatureCelsius(Number(e.target.value) || 0)} disabled={formDisabled} />
          </div>
          <div>
            <FieldLabel htmlFor="adv-grav">Gravity (m/s²)</FieldLabel>
            <Input id="adv-grav" type="number" step={0.1} value={gravityMs2 || ""} onChange={(e) => setGravityMs2(Number(e.target.value) || 9.8)} disabled={formDisabled} />
          </div>
          <div>
            <FieldLabel htmlFor="adv-press">Pressure (kPa)</FieldLabel>
            <Input id="adv-press" type="number" step={0.1} value={pressureKpa || ""} onChange={(e) => setPressureKpa(Number(e.target.value) || 101)} disabled={formDisabled} />
          </div>
        </div>
      </SolverSection>

      <SolverSection
        title="Weapons"
        description="Select the three weapons available to your character."
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <FieldLabel htmlFor={`adv-weapon-${i}`}>Weapon {i + 1}</FieldLabel>
              <select
                id={`adv-weapon-${i}`}
                value={weapons[i]}
                onChange={(e) => setWeapons((prev) => {
                  const next = [...prev] as [string, string, string];
                  next[i] = e.target.value;
                  return next;
                })}
                disabled={formDisabled}
                className={SELECT_CLASS}
              >
                <option value="">Select weapon</option>
                {WEAPONS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverSection
        title="Misc items"
        description="Select the five inventory items shown on the module."
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i}>
              <FieldLabel htmlFor={`adv-item-${i}`}>Item {i + 1}</FieldLabel>
              <select
                id={`adv-item-${i}`}
                value={miscItems[i]}
                onChange={(e) => setMiscItems((prev) => {
                  const next = [...prev] as [string, string, string, string, string];
                  next[i] = e.target.value;
                  return next;
                })}
                disabled={formDisabled}
                className={SELECT_CLASS}
              >
                <option value="">Select item</option>
                {MISC_ITEMS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
      />

      <ErrorAlert error={error} />

      {result && (
        <>
          <SolverResult
            variant="success"
            title="Use these on the module"
            description={resultDescription}
          />
          {result.itemsToUse.includes("Potion") && (
            <SolverResult
              variant="warning"
              title="Potion changes stats"
              description={
                "Potion is meant to be used last. If your STR/DEX/INT change after drinking it, recheck — pick \"I used Potion first\" with the new stats to get the other items + weapon, or \"Stats are after using all items\" to get only the weapon."
              }
            />
          )}
        </>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Enter the enemy, your stats, the world readings, and the three weapons + five inventory
        items. Use the items in any order, then attack with the chosen weapon. If Potion changes
        your stats, re-solve with the appropriate toggle above.
      </SolverInstructions>
    </SolverLayout>
  );
}
