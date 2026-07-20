import { useCallback, useState } from "react";
import { cn } from "../../lib/cn";
import {
  solveCurriculum, type CurriculumButtonSchedule, type CurriculumClassPair, type CurriculumOutput,
} from "../../services/curriculumService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const CLASS_PAIRS: Array<{ value: CurriculumClassPair; label: string; classes: [string, string] }> = [
  { value: "PHYSICS_MATHS", label: "Physics / Maths", classes: ["Physics", "Maths"] },
  { value: "PHILOSOPHY_LITERATURE", label: "Philosophy / Literature", classes: ["Philosophy", "Literature"] },
  { value: "PROGRAMMING_ECONOMY", label: "Programming / Economy", classes: ["Programming", "Economy"] },
  { value: "LINGUISTICS_MANAGEMENT", label: "Linguistics / Management", classes: ["Linguistics", "Management"] },
  { value: "LOGIC_ELECTRONICS", label: "Logic / Electronics", classes: ["Logic", "Electronics"] },
];

type PairValue = CurriculumClassPair | "";
type ButtonDraft = Omit<CurriculumButtonSchedule, "classPair"> & { classPair: PairValue };
type SavedState = { buttons?: ButtonDraft[]; result?: CurriculumOutput | null };

const emptyButtons = (): ButtonDraft[] => Array.from({ length: 5 }, () => ({
  classPair: "",
  sections: Array.from({ length: 6 }, () => Array(30).fill(false)),
  currentSection: 1,
}));

const stateLabel = (pairValue: PairValue, state: number) => {
  const pair = CLASS_PAIRS.find((option) => option.value === pairValue);
  return pair ? `${pair.classes[state < 3 ? 0 : 1]} ${state % 3 + 1}` : `State ${state + 1}`;
};

export default function CurriculumSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [buttons, setButtons] = useState(emptyButtons);
  const [activeButton, setActiveButton] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [result, setResult] = useState<CurriculumOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  useSolverModulePersistence<SavedState, CurriculumOutput>({
    state: { buttons, result },
    onRestoreState: useCallback((saved) => {
      if (saved.buttons?.length === 5) setButtons(saved.buttons);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: setResult,
    currentModule,
    setIsSolved,
  });

  const updateButton = (index: number, update: Partial<ButtonDraft>) => {
    setButtons((current) => current.map((button, buttonIndex) => buttonIndex === index ? { ...button, ...update } : button));
    setResult(null); clearError();
  };

  const toggleCell = (cell: number) => {
    setButtons((current) => current.map((button, buttonIndex) => {
      if (buttonIndex !== activeButton) return button;
      return { ...button, sections: button.sections.map((section, sectionIndex) => sectionIndex === activeSection
        ? section.map((filled, cellIndex) => cellIndex === cell ? !filled : filled)
        : section) };
    }));
    setResult(null); clearError();
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { buttons: buttons as CurriculumButtonSchedule[] };
      const response = await solveCurriculum(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { buttons, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Curriculum"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setButtons(emptyButtons()); setActiveButton(0); setActiveSection(0); setResult(null); resetSolverState();
  };

  const pair = CLASS_PAIRS.find((option) => option.value === buttons[activeButton].classPair);
  const activeClass = pair?.classes[activeSection < 3 ? 0 : 1];
  const lectureCount = buttons[activeButton].sections[activeSection].filter(Boolean).length;
  const assignedPairs = buttons.map((button) => button.classPair).filter(Boolean);
  const complete = new Set(assignedPairs).size === 5 && buttons.every((button) =>
    button.sections.every((section) => section.filter(Boolean).length >= 2 && section.filter(Boolean).length <= 3));
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.CURRICULUM, result }) : "";

  return <SolverLayout>
    <SolverSection title="Button order" description="Assign the class pair shown by each physical button, left to right, and record the section currently displayed.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {buttons.map((button, index) => <fieldset key={index} className="rounded-lg border border-border p-3">
          <legend className="px-1 text-sm font-semibold">Button {index + 1}</legend>
          <label className="block text-xs text-muted-foreground">Class pair
            <select value={button.classPair} onChange={(event) => updateButton(index, { classPair: event.target.value as PairValue })}
              disabled={isLoading || isSolved} aria-label={`Button ${index + 1} class pair`}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Choose pair</option>
              {CLASS_PAIRS.map((option) => <option key={option.value} value={option.value}
                disabled={buttons.some((other, otherIndex) => otherIndex !== index && other.classPair === option.value)}>{option.label}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-xs text-muted-foreground">Currently showing
            <select value={button.currentSection} onChange={(event) => updateButton(index, { currentSection: Number(event.target.value) })}
              disabled={isLoading || isSolved} aria-label={`Button ${index + 1} current section`}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
              {Array.from({ length: 6 }, (_, section) => <option key={section} value={section + 1}>{stateLabel(button.classPair, section)}</option>)}
            </select>
          </label>
        </fieldset>)}
      </div>
    </SolverSection>

    <SolverSection title="Lecture grids" description="Choose a button and cycle through all six states. Toggle the 2–3 white lecture cells shown in each state.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Button
          <select value={activeButton} onChange={(event) => setActiveButton(Number(event.target.value))} disabled={isLoading || isSolved}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {buttons.map((button, index) => <option key={index} value={index}>Button {index + 1}{button.classPair ? ` — ${CLASS_PAIRS.find((item) => item.value === button.classPair)?.label}` : ""}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Displayed state
          <select value={activeSection} onChange={(event) => setActiveSection(Number(event.target.value))} disabled={isLoading || isSolved}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            {Array.from({ length: 6 }, (_, section) => <option key={section} value={section}>{stateLabel(buttons[activeButton].classPair, section)}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-4 text-center text-sm font-semibold">{activeClass ? `${activeClass}, section ${activeSection % 3 + 1}` : "Assign this button’s class pair first"} · {lectureCount}/3 lectures</p>
      <div className="mx-auto mt-3 grid max-w-xl grid-cols-[auto_repeat(6,minmax(0,1fr))] gap-1" role="grid" aria-label={`Button ${activeButton + 1}, state ${activeSection + 1} lecture grid`}>
        <span role="presentation" />
        {Array.from({ length: 6 }, (_, slot) => <span key={slot} role="columnheader" className="text-center text-xs font-semibold">{slot + 1}</span>)}
        {DAYS.map((day, dayIndex) => <div key={day} role="row" className="contents">
          <span role="rowheader" className="flex items-center justify-end pr-2 text-xs font-medium">{day.slice(0, 3)}</span>
          {Array.from({ length: 6 }, (_, slot) => {
            const cell = dayIndex * 6 + slot;
            const filled = buttons[activeButton].sections[activeSection][cell];
            return <button key={cell} type="button" role="gridcell" aria-label={`${day}, slot ${slot + 1}: ${filled ? "lecture" : "empty"}`}
              aria-pressed={filled} onClick={() => toggleCell(cell)} disabled={isLoading || isSolved || !filled && lectureCount >= 3}
              className={cn("aspect-square rounded border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filled ? "bg-foreground" : "bg-background hover:bg-muted")} />;
          })}
        </div>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={!complete} solveText="Find schedule" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Use this schedule" className="border-emerald-500/40"
      description={`${result.condition}${result.bookworm ? " + Bookworm" : ""}; ${result.conflicts} conflict${result.conflicts === 1 ? "" : "s"}.`}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {result.classes.map((className, index) => <div key={index} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
          <div className="text-xs text-muted-foreground">Button {index + 1} · state {result.buttonStates[index]}</div>
          <div className="mt-1 font-semibold">{className}</div>
          <div className="text-sm">Section {result.classSections[index]}</div>
        </div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Cycle every button through its six states and note where you finish. The result accounts for class parity, the first matching special condition, and Bookworm.</SolverInstructions>
  </SolverLayout>;
}
