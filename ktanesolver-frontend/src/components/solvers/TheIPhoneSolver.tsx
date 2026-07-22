import { useState } from "react";

import {
  solveTheIPhone, type IPhoneMessage, type IPhonePerson, type TheIPhoneInput, type TheIPhoneOutput,
} from "../../services/theIPhoneService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { Button } from "../ui/button";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const APPS = ["ANGRY_BIRDS", "MESSAGES", "PHOTOS", "TINDER", "CHEAT_CODES"] as const;
type App = typeof APPS[number];
const PEOPLE: IPhonePerson[] = ["PHIL", "ROB", "MICK", "ANDY"];
const CHARACTERS = [
  "RED_ANGRY_BIRD", "YELLOW_ANGRY_BIRD", "BLUE_ANGRY_BIRD", "WHITE_ANGRY_BIRD", "BLACK_ANGRY_BIRD",
  "REGULAR_PIG", "HELMET_PIG", "MOUSTACHED_PIG", "KING_PIG", "BLACK_EYED_PIG",
];
const MESSAGE_STYLES: Record<IPhonePerson, string> = {
  PHIL: '“The 2nd number is #.” / “Not sure. Maybe #?” / “# mate.”',
  ROB: '“#” / “# is the second number.” / “I think it’s #.”',
  MICK: '“It’s #” / “#? No...yes, #” / “#?”',
  ANDY: '“Probably #” / “# you numpty!” / “#!”',
};
const PHOTOS = ["Beach", "Christmas Tree", "Computer", "Porsche", "Composer", "Castle", "Spaniel", "Football team", "Band", "Roast Dinner"];
const POSITIONS = ["Top left", "Top right", "Bottom left", "Bottom right"];
const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function TheIPhoneSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [app, setApp] = useState<App>("ANGRY_BIRDS");
  const [characters, setCharacters] = useState(["", "", "", ""]);
  const [messageStyles, setMessageStyles] = useState(["", "", "", ""]);
  const [messageDigits, setMessageDigits] = useState([0, 0, 0, 0]);
  const [photoDigit, setPhotoDigit] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState(18);
  const [starSign, setStarSign] = useState("VIRGO");
  const [hobby, setHobby] = useState("BADMINTON");
  const [pet, setPet] = useState("CAT");
  const [revealedDigits, setRevealedDigits] = useState([0, 0]);
  const [pinDigits, setPinDigits] = useState<Array<number | null>>([null, null, null, null]);
  const [tinderProgress, setTinderProgress] = useState(0);
  const [result, setResult] = useState<TheIPhoneOutput | null>(null);
  const {
    currentModule, round, isLoading, isSolved, error, setIsLoading, setIsSolved, setError,
    clearError, reset: resetSolverState, markModuleSolved,
  } = useSolver();

  useSolverModulePersistence<{ pinDigits: Array<number | null>; tinderProgress: number }, TheIPhoneOutput>({
    state: { pinDigits, tinderProgress },
    onRestoreState: (state) => {
      if (Array.isArray(state.pinDigits)) setPinDigits(state.pinDigits);
      if (typeof state.tinderProgress === "number") setTinderProgress(state.tinderProgress);
    },
    onRestoreSolution: (solution) => { setResult(solution); setPinDigits(solution.pinDigits); setTinderProgress(solution.tinderProgress); },
    extractSolution: (raw) => raw && typeof raw === "object" && "pinDigits" in raw ? raw as TheIPhoneOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved), currentModule, setIsSolved,
  });

  const submit = async (input: TheIPhoneInput) => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required module information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTheIPhone(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setPinDigits(response.output.pinDigits); setTinderProgress(response.output.tinderProgress);
      if (response.solved) { setIsSolved(true); markModuleSolved(bomb.id, currentModule.id); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The iPhone"); }
    finally { setIsLoading(false); }
  };

  const solve = () => {
    if (app === "ANGRY_BIRDS") return submit({ action: app, characters });
    if (app === "MESSAGES") {
      const messages: IPhoneMessage[] = PEOPLE.map((sender, index) => ({ sender, style: messageStyles[index] as IPhonePerson, digit: messageDigits[index] }));
      return submit({ action: app, messages });
    }
    if (app === "PHOTOS") return submit({ action: app, photoDigit });
    if (app === "TINDER") return submit({ action: app, tinder: { name, age, starSign, hobby, pet } });
    return submit({ action: "CHEAT_CODES" });
  };

  const reset = () => {
    setCharacters(["", "", "", ""]); setMessageStyles(["", "", "", ""]); setMessageDigits([0, 0, 0, 0]);
    setPhotoDigit(0); setName(""); setAge(18); setPinDigits([null, null, null, null]); setTinderProgress(0); setResult(null); resetSolverState();
  };
  const solveDisabled = app === "ANGRY_BIRDS" ? characters.some((character) => !character)
    : app === "MESSAGES" ? messageStyles.some((style) => !style) : app === "TINDER" ? !name.trim() : false;
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.THE_IPHONE, result }) : "";

  return <SolverLayout>
    <SolverSection title="Factory-reset PIN" description="Messages and Photos fill themselves; record the digits revealed by Angry Birds and Tinder.">
      <div className="grid grid-cols-4 gap-2" aria-label="PIN progress">
        {pinDigits.map((digit, index) => <div key={index} className="rounded-md border bg-muted/40 p-3 text-center"><div className="text-xs text-muted-foreground">Digit {index + 1}</div><div className="text-2xl font-bold">{digit ?? "?"}</div></div>)}
      </div>
      {!isSolved && <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[1, 4].map((position, index) => <label key={position} className="text-sm font-medium">
          Revealed digit {position}
          <div className="mt-2 flex gap-2"><input type="number" min={0} max={9} value={revealedDigits[index]} onChange={(event) => setRevealedDigits((current) => current.map((digit, i) => i === index ? Number(event.target.value) : digit))} disabled={isLoading} className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3" />
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => submit({ action: "RECORD_DIGIT", pinPosition: position, pinDigit: revealedDigits[index] })}>Record</Button>
          </div>
        </label>)}
      </div>}
    </SolverSection>

    {!isSolved && <SolverSection title="App" description="Choose the app currently shown on the module.">
      <select value={app} onChange={(event) => { setApp(event.target.value as App); setResult(null); clearError(); }} disabled={isLoading} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
        {APPS.map((value) => <option key={value} value={value}>{value === "CHEAT_CODES" ? "Phone (cheat codes)" : label(value)}</option>)}
      </select>
    </SolverSection>}

    {!isSolved && app === "ANGRY_BIRDS" && <SolverSection title="Angry Birds" description="Enter the four characters in screen position order.">
      <div className="grid grid-cols-2 gap-3">{characters.map((character, index) => <label key={index} className="text-sm font-medium">{POSITIONS[index]}<select value={character} onChange={(event) => setCharacters((current) => current.map((value, i) => i === index ? event.target.value : value))} disabled={isLoading} className="mt-2 h-9 w-full rounded-md border bg-background px-2"><option value="">Select character…</option>{CHARACTERS.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>)}</div>
    </SolverSection>}

    {!isSolved && app === "MESSAGES" && <SolverSection title="Messages" description="For each sender, match the wording family and enter the number replacing #.">
      <div className="space-y-3">{PEOPLE.map((person, index) => <div key={person} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[5rem_1fr_5rem] sm:items-center"><strong className="text-sm">{label(person)}</strong><select aria-label={`${label(person)} message style`} value={messageStyles[index]} onChange={(event) => setMessageStyles((current) => current.map((value, i) => i === index ? event.target.value : value))} disabled={isLoading} className="h-9 min-w-0 rounded-md border bg-background px-2"><option value="">Match wording…</option>{PEOPLE.map((style) => <option key={style} value={style}>{MESSAGE_STYLES[style]}</option>)}</select><input aria-label={`${label(person)} digit`} type="number" min={0} max={9} value={messageDigits[index]} onChange={(event) => setMessageDigits((current) => current.map((value, i) => i === index ? Number(event.target.value) : value))} disabled={isLoading} className="h-9 rounded-md border bg-background px-2" /></div>)}</div>
    </SolverSection>}

    {!isSolved && app === "PHOTOS" && <SolverSection title="Photos" description="Select the one manual-listed photo that appears among the eight.">
      <select value={photoDigit} onChange={(event) => setPhotoDigit(Number(event.target.value))} disabled={isLoading} className="h-9 w-full rounded-md border bg-background px-3">{PHOTOS.map((photo, digit) => <option key={photo} value={digit}>{digit} — {photo}</option>)}</select>
    </SolverSection>}

    {!isSolved && app === "TINDER" && <SolverSection title="Tinder" description={`Correct profiles: ${tinderProgress} of 3. Uses the bomb's current ${bomb?.strikes ?? 0} strike(s).`}>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Name<input value={name} onChange={(event) => setName(event.target.value)} disabled={isLoading} className="mt-2 h-9 w-full rounded-md border bg-background px-3" /></label><label className="text-sm font-medium">Age<input type="number" min={18} value={age} onChange={(event) => setAge(Number(event.target.value))} disabled={isLoading} className="mt-2 h-9 w-full rounded-md border bg-background px-3" /></label>
        <Choice labelText="Star sign" value={starSign} values={["VIRGO", "LEO", "SCORPIO", "CAPRICORN", "CANCER", "GEMINI"]} onChange={setStarSign} disabled={isLoading} />
        <Choice labelText="Hobby" value={hobby} values={["BADMINTON", "GOLF", "CINEMA", "THEATRE", "DANCING", "CLUBBING"]} onChange={setHobby} disabled={isLoading} />
        <Choice labelText="Pet" value={pet} values={["CAT", "DOG", "GOLDFISH", "GERBIL", "HAMSTER"]} onChange={setPet} disabled={isLoading} />
      </div>
      {tinderProgress > 0 && <Button type="button" variant="outline" className="mt-4" disabled={isLoading} onClick={() => submit({ action: "RESET_TINDER" })}>Tinder reset after a strike</Button>}
    </SolverSection>}

    {result && <><SolverResult title={result.instruction} description={result.matchScore === null ? undefined : `Match score: ${result.matchScore}`} />
      {app === "CHEAT_CODES" && <div className="grid gap-2 sm:grid-cols-2">{Object.entries(result.cheatCodes).map(([name, code]) => <div key={name} className="rounded-md border p-3"><span className="text-sm text-muted-foreground">{name}</span><div className="font-mono text-lg font-semibold">{code}</div></div>)}</div>}
    </>}
    {!isSolved && <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={solveDisabled} solveText={app === "CHEAT_CODES" ? "Show cheat codes" : `Solve ${label(app)}`} />}
    <ErrorAlert error={error} />
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The Phone codes always cause a strike. Any strike resets Tinder; use the reset button before entering the replacement profile.</SolverInstructions>
  </SolverLayout>;
}

function Choice({ labelText, value, values, onChange, disabled }: { labelText: string; value: string; values: string[]; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="text-sm font-medium">{labelText}<select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-2 h-9 w-full rounded-md border bg-background px-3">{values.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>;
}
