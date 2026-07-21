import { useCallback, useMemo, useState } from "react";
import {
  SONIC_MONITORS,
  SONIC_PICTURES,
  SONIC_SOUNDS,
  solveSonicTheHedgehog,
  type SonicPicture,
  type SonicSound,
  type SonicTheHedgehogOutput,
} from "../../services/sonicTheHedgehogService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { Button } from "../ui/button";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  StageIndicator,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

const SELECT_CLASS = "mt-1 h-11 w-full rounded-md border border-input bg-background px-3";
const emptySounds = (): Array<SonicSound | ""> => ["", "", "", ""];

export default function SonicTheHedgehogSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [sounds, setSounds] = useState<Array<SonicSound | "">>(emptySounds);
  const [pictures, setPictures] = useState<SonicPicture[]>([]);
  const [picture, setPicture] = useState<SonicPicture | "">("");
  const [result, setResult] = useState<SonicTheHedgehogOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const stage = Math.min(pictures.length + 1, 3);
  const savedState = useMemo(
    () => ({ sounds, pictures, picture, result, twitchCommand }),
    [sounds, pictures, picture, result, twitchCommand],
  );

  useSolverModulePersistence<typeof savedState, SonicTheHedgehogOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.sounds) && saved.sounds.length === 4) setSounds(saved.sounds);
      if (Array.isArray(saved.pictures)) setPictures(saved.pictures);
      if (typeof saved.picture === "string") setPicture(saved.picture);
      if (saved.result) setResult(saved.result);
      if (typeof saved.twitchCommand === "string") setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: SonicTheHedgehogOutput) => {
      if (!solution?.button) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SONIC_THE_HEDGEHOG, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (sounds.some((sound) => !sound)) return setError("Select the sound played by every monitor");
    if (!picture) return setError(`Select the level ${stage} picture`);
    clearError(); setIsLoading(true);
    try {
      const input = { stage, sounds: sounds as SonicSound[], picture };
      const response = await solveSonicTheHedgehog(round.id, bomb.id, currentModule.id, input);
      const nextPictures = [...pictures, picture];
      const command = generateTwitchCommand({ moduleType: ModuleType.SONIC_THE_HEDGEHOG, result: response.output });
      setPictures(nextPictures); setPicture(""); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { sounds, pictures: nextPictures, picture: "", result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Sonic the Hedgehog"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, sounds, picture, stage, pictures, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const resetAttempt = useCallback(() => {
    setSounds(emptySounds()); setPictures([]); setPicture(""); setResult(null); setTwitchCommand(""); clearError();
  }, [clearError]);
  const reset = useCallback(() => { resetAttempt(); resetSolverState(); }, [resetAttempt, resetSolverState]);
  const valid = sounds.every(Boolean) && Boolean(picture);

  return <SolverLayout>
    <SolverSection title="Level progress" description={isSolved ? "All three levels complete." : `Level ${stage} of 3`}>
      <StageIndicator total={3} current={isSolved ? 4 : stage} completedThrough={pictures.length} />
    </SolverSection>

    {!isSolved && !result && <>
      {stage === 1 && <SolverSection title="Monitor sounds" description="Identify all four sounds before pressing Start; duplicates are allowed.">
        <div className="grid gap-3 sm:grid-cols-2">
          {SONIC_MONITORS.map((monitor, index) => <label key={monitor.code} className="text-sm font-medium">{monitor.label} sound
            <select
              aria-label={`${monitor.label} sound`}
              value={sounds[index]}
              onChange={(event) => {
                setSounds((current) => current.map((sound, soundIndex) => soundIndex === index ? event.target.value as SonicSound : sound));
                clearError();
              }}
              disabled={isLoading}
              className={SELECT_CLASS}
            >
              <option value="">Select sound…</option>
              {SONIC_SOUNDS.map((sound) => <option key={sound}>{sound}</option>)}
            </select>
          </label>)}
        </div>
      </SolverSection>}

      <SolverSection
        title={`Level ${stage} picture`}
        description={stage === 1 ? "Press Start on the module, then identify the displayed Badnik." : "Identify the newly displayed picture."}
      >
        <label className="text-sm font-medium">Displayed picture
          <select
            aria-label={`Level ${stage} picture`}
            value={picture}
            onChange={(event) => { setPicture(event.target.value as SonicPicture); clearError(); }}
            disabled={isLoading}
            className={SELECT_CLASS}
          >
            <option value="">Select picture…</option>
            {SONIC_PICTURES[stage - 1].map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
      </SolverSection>
    </>}

    {!result && <SolverControls
      onSolve={solve}
      onReset={reset}
      isLoading={isLoading}
      isSolved={isSolved}
      isSolveDisabled={!valid}
      solveText={`Solve level ${stage}`}
    />}
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Level ${result.stage}: press ${result.monitor}`} className="border-emerald-500/40">
      <p className="text-center text-4xl font-bold">{result.button}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">{result.monitor} monitor</p>
      {!isSolved && <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => { setResult(null); setTwitchCommand(""); }}>Enter level {stage} picture</Button>
        <Button type="button" variant="outline" onClick={resetAttempt}>This press struck</Button>
      </div>}
    </SolverSection>}
    {!isSolved && !result && stage > 1 && <Button type="button" variant="outline" onClick={resetAttempt} disabled={isLoading}>Module reset after a strike</Button>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The monitor order is Running Boots, Invincibility, Extra Life, Rings. A strike rerolls every sound and picture, so reset this solver and identify all four sounds again.</SolverInstructions>
  </SolverLayout>;
}
