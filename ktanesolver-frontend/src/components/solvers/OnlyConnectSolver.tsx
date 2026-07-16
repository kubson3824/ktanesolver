import { useCallback, useMemo, useState, type SVGProps } from "react";

import { solveOnlyConnect, type OnlyConnectOutput } from "../../services/onlyConnectService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";
import CharacterKeyboard, { ONLY_CONNECT_KEYBOARD_CHARACTERS } from "../common/CharacterKeyboard";

export const ONLY_CONNECT_HIEROGLYPHS = [
  "Two Reeds", "Lion", "Twisted Flax", "Horned Viper", "Water", "Eye of Horus",
] as const;
const POSITIONS = ["Top left", "Top middle", "Top right", "Bottom left", "Bottom middle", "Bottom right"];
const emptyLetters = () => Array<string>(9).fill("");

export function OnlyConnectHieroglyph({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 784.36217 500 268" role="img" aria-label={name} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {name === "Two Reeds" && <path d="M309.05686 1020.008C308.68703 897.96649 305.73969 808.94909 280.95035 811.42803 269.85567 812.5375 270.59532 895.00791 271.70479 940.49607 293.70922 953.9946 306.13806 972.21456 309.10309 988.89659 313.67964 1014.6455 309.05686 1020.008 309.05686 1020.008ZM233.35799 1020.0079C232.98816 897.96651 230.04082 808.94912 205.25148 811.42806 194.1568 812.53752 194.89645 895.00793 196.00592 940.49609 218.01035 953.99462 230.43919 972.21458 233.40422 988.89661 237.98077 1014.6455 233.35799 1020.0079 233.35799 1020.0079Z" />}
    {name === "Lion" && <>
      <path strokeWidth="6" d="M147.1259 914.02612S145.23702 912.84206 143.42443 912.20207C141.98138 911.69256 140.00808 911.52184 138.7425 911.42196 137.22595 911.30227 135.25372 911.41642 134.06065 911.92209" />
      <path d="M135.23854 897.0526C136.2898 899.81513 132.44121 901.46392 133.38555 904.37969 134.32554 907.28201 133.29246 910.42324 133.94107 913.45494 134.65455 916.78985 134.99247 921.13073 138.4286 922.66306 141.66198 924.10497 145.35532 923.97096 148.8335 923.92193 151.59245 923.88304 154.41936 924.66404 157.08271 923.94134 159.51072 923.2825 160.73214 920.71271 162.76989 919.43488 166.81702 916.89702 173.90122 915.6428 177.97276 918.12074" />
      <path d="M128.51491 898.99416C133.53069 892.71656 138.27424 885.12537 143.42911 880.78284 149.10837 875.99856 150.6771 869.78461 152.84556 863.27725 155.60615 854.99295 163.08019 849.16108 171.52818 849.61812 181.16112 850.13926 190.68171 848.55905 200.15502 846.95076 208.15971 845.5918 216.09853 849.14622 222.72059 853.2647 230.48685 858.09479 232.04826 868.23298 238.81059 874.10386 245.14425 879.60257 248.71156 886.99645 253.26883 893.79871 258.46069 901.54816 261.54853 911.25172 260.18948 920.36464 258.69721 930.37091 255.7082 940.24586 251.85128 949.59316 248.46894 957.79032 241.19007 963.58931 235.88013 970.58216 233.44733 973.786 229.50477 975.97134 228.18047 979.87696" />
      <path d="M152.36686 865.23199C156.18227 866.07694 160.13371 865.32329 163.8344 864.22559 167.41305 863.16409 171.31135 862.96352 174.92604 863.7527 177.57785 864.33166 181.19278 864.58679 182.92574 865.66012 187.19791 868.30614 189.82778 862.76832 193.55777 862.02506 197.20389 861.29852 201.67438 859.90709 204.7513 861.97078 207.91839 864.09495 210.53245 870.8296 206.19811 874.18458 203.27976 876.44351 199.64384 877.26558 196.03009 877.27513 191.01634 877.28838 191.02805 882.70971 191.95146 885.8881 193.20794 890.21291 191.32857 894.84018 190.27963 899.14463 189.213 903.52167 186.17005 906.24597 183.78062 909.73815 181.91806 912.46029 180.59863 915.60564 178.22024 918.26102 175.47642 921.3244 174.31382 925.08615 172.25632 928.59373 170.36963 931.81012 169.60554 935.58177 169.16505 939.31946 168.74378 942.89403 167.82299 946.40133 167.89941 950.00598 167.96674 953.18219 167.89941 956.35981 167.89941 959.53673" />
      <path strokeWidth="5" d="M158.77899 876.33049C160.54043 876.8705 161.01879 878.16969 161.69355 879.52914 161.98517 880.14253 163.03351 880.11593 163.27097 879.47043 164.53372 878.60752 165.18251 877.50342 166.13716 876.74502 166.08347 876.16669 165.38507 876.01284 164.91546 876.16415 162.98315 876.53388 160.56696 876.35301 158.77899 876.33049Z" />
      <path d="M248.89053 886.31187C255.67522 890.16467 261.67324 895.42945 269.08723 898.12722 278.11128 901.86076 287.8608 903.138 297.5056 904.08994 302.9058 904.66166 308.32529 905.04714 313.75105 905.2674" />
      <path d="M212.27811 980.36217C208.90839 969.61312 216.62827 959.00605 223.55249 951.76638 230.006 945.01886 234.72708 933.34264 229.12615 925.31231 223.72715 917.5715 211.88194 914.3226 202.6233 917.20563 191.02738 920.81646 187.2662 933.3619 183.71351 943.4341 180.05518 953.8058 174.60382 958.8889 164.00232 960.39281 153.68097 961.85698 141.60378 962.83009 131.26059 963.50663 116.83295 964.45034 102.35752 963.81897 87.946638 964.10092 80.871591 964.23934 69.265572 980.36217 79.419928 980.36217H249.11092C260.61621 980.36217 271.4363 975.54038 281.56592 969.59005 292.83223 962.972 306.74171 966.33975 319.2571 963.74011 320.68236 963.44406 322.60304 963.17629 324.0523 963.03882" />
      <path d="M291.42012 966.56335C283.77729 984.37695 298.34717 979.88874 309.61684 980.36217 315.06588 980.66915 324.62613 980.36217 332.13078 980.36217H383.61006C399.50581 980.39459 413.15594 983.68219 415.8417 963.5128 416.00992 949.69478 405.34123 938.20353 398.29808 929.94611 382.9346 911.96266 355.60891 904.04479 333.56995 903.97265" />
      <path d="M388.68343 962.86513C370.70734 970.93743 349.44779 964.24855 335.07887 951.53786 323.12361 940.96228 319.38445 924.59041 326.973 910.84683 335.39292 895.59755 350.56856 892.93234 365.83075 887.2502 373.28701 884.47423 367.3189 874.73924 355.21282 877.03545 343.95134 879.17147 331.14507 884.57243 324.43935 891.25426 304.08002 911.54103 302.96334 937.23999 320.87146 958.86606 327.28123 966.60658 335.27076 972.84158 343.34845 978.74699" />
    </>}
    {name === "Twisted Flax" && <path d="M230.39941 1021.6669C231.36023 1008.3577 236.51309 998.92148 243.49622 987.4571 248.42442 979.36633 256.59486 970.85232 261.3689 962.67187 265.05612 956.35373 265.38083 947.67312 258.75461 938.77027 253.20811 931.31811 249.38767 926.77794 242.97004 919.28492 237.06149 912.38629 235.54343 909.15755 235.34808 900.54796 235.0549 887.62608 245.86758 878.01918 251.78026 871.55795 259.46501 863.16027 263.49031 855.62211 263.61152 844.87776 263.7366 833.79038 259.44461 825.59516 249.98838 825.38141 240.61785 825.1696 235.75698 834.56062 236.06007 846.25117 236.37008 858.2084 247.27939 871.70432 253.4196 878.51055 259.3316 885.0638 264.28883 890.47036 263.97603 900.26396 263.55765 913.36313 254.10316 920.55388 249.76193 926.79417 246.32882 931.72909 240.72779 935.25027 237.56049 942.52129 234.49338 949.56233 234.41289 957.79638 239.01777 964.38189 244.50345 972.22704 253.21356 982.54526 258.18325 990.66249 265.92165 1003.3019 268.10874 1009.6057 269.60059 1021.6668" />}
    {name === "Horned Viper" && <>
      <path strokeLinecap="butt" d="M399.49393 930.03736C388.39499 940.12582 372.55788 939.51336 360.46138 940.08391 334.54243 941.30642 309.60491 924.19829 284.21031 924.42022 268.98467 924.55328 257.61034 929.32315 243.60848 934.85392 233.8517 938.70787 223.40621 941.84143 212.58955 940.83886 196.55291 939.35246 182.55851 934.78938 168.11163 927.35059 158.76156 922.53618 147.30539 915.88142 136.29514 915.33725 126.32674 914.84457 112.57638 917.7866 106.38942 912.32296 94.683271 901.98537 113.39181 889.21716 125.16255 890.57061 140.80551 892.36931 154.57559 900.6395 168.49824 906.91974 188.64217 916.00628 210.63091 920.40682 232.90439 912.47028 252.25317 905.57588 273.43759 902.80344 294.16893 907.20294 319.79678 912.64155 337.99941 931.28239 367.26775 932.82579 378.9874 933.4438 387.46926 932.59186 399.49393 930.03736Z" />
      <path strokeLinecap="butt" d="M115.49708 891.54346C113.66897 886.81203 108.0971 886.40781 103.38437 886.97469 108.86395 895.87623 109.34023 890.17441 110.23392 894.46743M132.45614 891.83585C136.01907 885.96401 137.84302 882.71511 145.33083 884.96477 141.55848 888.22796 140.72664 889.47477 139.83052 892.62346 139.72655 893.04718 139.61653 893.47009 139.47368 893.88264" />
    </>}
    {name === "Water" && <g transform="translate(0 784.36217)">
      <path d="M162.284 87.5 175.141 59 187.998 87.5 200.855 59 213.712 87.5 226.569 59 239.426 87.5 252.283 59 265.14 87.5 277.997 59 290.854 87.5 303.711 59 316.568 87.5 329.425 59 342.282 87.5" />
      <path d="M162.284 152 175.141 123.5 187.998 152 200.855 123.5 213.712 152 226.569 123.5 239.426 152 252.283 123.5 265.14 152 277.997 123.5 290.854 152 303.711 123.5 316.568 152 329.425 123.5 342.282 152" />
      <path d="M162.284 216.5 175.141 188 187.998 216.5 200.855 188 213.712 216.5 226.569 188 239.426 216.5 252.283 188 265.14 216.5 277.997 188 290.854 216.5 303.711 188 316.568 216.5 329.425 188 342.282 216.5" />
    </g>}
    {name === "Eye of Horus" && <>
      <path d="M350.2924 882.18673C287.58538 855.01006 267.33524 846.92193 227.32428 850.55109 197.6381 855.82222 173.49109 871.68271 154.80603 886.67854 157.43023 888.79756 164.41787 897.37511 166.08187 900.31538" />
      <path d="M359.94152 914.05808C338.79229 906.64208 325.23585 902.7939 309.0682 895.73395 286.051 885.68458 273.51032 880.30165 243.79175 880.40966 213.30485 880.52047 164.91007 893.6211 152.98163 911.67317 178.82889 933.62851 200.87916 940.45771 234.97672 941.3083 277.56149 942.37061 308.38116 919.49675 328.87642 903.94527" />
      <path d="M238.30409 880.43234C225.92386 887.93746 226.29889 900.68913 235.56063 906.58522 244.89362 912.52667 258.54983 909.96108 262.45014 897.13005 264.28666 891.08836 259.35914 883.92749 254.38596 880.72474" />
      <path d="M221.34503 940.66626C221.25639 951.63478 218.83929 962.59614 221.6891 973.54629 223.7742 981.55811 225.85558 991.89387 235.76523 992.96538 245.36023 994.00287 247.12933 981.69552 243.8632 974.43111 240.29223 966.48869 238.31626 956.71255 239.93366 948.04123 241.5059 939.61205 248.50332 944.61571 260.40877 950.67017 272.4236 956.78025 279.98559 962.33013 292.57925 971.9234 302.23397 979.27791 308.07618 984.15015 316.66177 986.20559 326.1094 988.46741 338.01815 987.77226 343.5188 979.86093 348.61094 972.53714 349.98475 960.37201 341.45477 955.89985 336.29952 953.19702 328.08442 954.96156 326.02339 960.8417" />
    </>}
  </svg>;
}

type PersistedState = {
  phase?: number;
  teamName?: string;
  hieroglyphs?: string[];
  letters?: string[];
  wall?: string[];
  result?: OnlyConnectOutput | null;
  twitchCommand?: string;
};

export default function OnlyConnectSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [phase, setPhase] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [hieroglyphs, setHieroglyphs] = useState<string[]>([...ONLY_CONNECT_HIEROGLYPHS]);
  const [letters, setLetters] = useState(emptyLetters);
  const [activeLetter, setActiveLetter] = useState(0);
  const [result, setResult] = useState<OnlyConnectOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ phase, teamName, hieroglyphs, letters, result, twitchCommand }), [phase, teamName, hieroglyphs, letters, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, OnlyConnectOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.teamName !== undefined) setTeamName(state.teamName);
      if (state.hieroglyphs?.length === 6) setHieroglyphs(state.hieroglyphs);
      if (state.letters?.length === 9) setLetters(state.letters);
      else if (state.wall?.length === 9) setLetters(state.wall);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      setPhase(state.phase ?? (state.hieroglyphs?.length === 6 ? 2 : 1));
    }, []),
    onRestoreSolution: useCallback((solution: OnlyConnectOutput) => {
      if (solution?.round !== 2) return;
      setPhase(2);
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ONLY_CONNECT, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "round" in raw ? raw as OnlyConnectOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const validGlyphs = new Set(hieroglyphs).size === 6;
  const validWall = letters.every((letter) => Array.from(letter.trim()).length === 1) && new Set(letters.map((letter) => letter.toLocaleLowerCase())).size === 9;

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (phase === 1 && (!teamName.trim() || !validGlyphs)) return setError("Enter the team and place each hieroglyph once");
    if (phase === 2 && !validWall) return setError("Enter nine different single letters");
    clearError(); setIsLoading(true);
    try {
      const input = phase === 1
        ? { round: 1, teamName, hieroglyphs, letters: null }
        : { round: 2, teamName: null, hieroglyphs: null, letters };
      const response = await solveOnlyConnect(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.ONLY_CONNECT, result: response.output });
      const nextPhase = response.output.round === 1 ? 2 : phase;
      setPhase(nextPhase); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { phase: nextPhase, teamName, hieroglyphs, letters, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Only Connect"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, phase, teamName, hieroglyphs, letters, validGlyphs, validWall, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setPhase(1); setTeamName(""); setHieroglyphs([...ONLY_CONNECT_HIEROGLYPHS]); setLetters(emptyLetters());
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    {phase === 1 ? <>
      <SolverSection title="Team name"><Input value={teamName} onChange={(event) => setTeamName(event.target.value.toUpperCase())} placeholder="ACADEMICALS" aria-label="Team name" disabled={isLoading || isSolved} /></SolverSection>
      <SolverSection title="Egyptian hieroglyphs" description="Set the six displayed positions in reading order.">
        <div className="grid grid-cols-3 gap-2">
          {hieroglyphs.map((glyph, index) => <label key={index} className="flex flex-col items-center gap-2 rounded-md border p-2 text-sm">
            <span className="text-center text-xs font-medium text-muted-foreground">{POSITIONS[index]}</span>
            <OnlyConnectHieroglyph name={glyph} className="h-9 w-16 shrink-0" />
            <select value={glyph} onChange={(event) => setHieroglyphs((current) => current.map((value, position) => position === index ? event.target.value : value))} disabled={isLoading || isSolved} aria-label={POSITIONS[index]} className="w-full min-w-0 bg-transparent text-center">
              {ONLY_CONNECT_HIEROGLYPHS.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>)}
        </div>
      </SolverSection>
    </> : <SolverSection title="Connecting wall" description="Enter the jumbled 3 × 3 grid in reading order.">
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {letters.map((letter, index) => <Input key={index} value={letter} onChange={(event) => setLetters((current) => current.map((value, position) => position === index ? Array.from(event.target.value.normalize("NFC")).at(-1) ?? "" : value))} onFocus={() => setActiveLetter(index)} maxLength={1} aria-label={`Wall letter ${index + 1}`} disabled={isLoading || isSolved} className="h-14 text-center text-2xl font-semibold" />)}
      </div>
      <CharacterKeyboard
        characters={ONLY_CONNECT_KEYBOARD_CHARACTERS}
        onCharacter={(character) => setLetters((current) => current.map((value, index) => index === activeLetter ? character : value))}
        onBackspace={() => setLetters((current) => current.map((value, index) => index === activeLetter ? "" : value))}
        targetLabel={`wall letter ${activeLetter + 1}`}
        disabled={isLoading || isSolved}
      />
    </SolverSection>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={phase === 1 ? !teamName.trim() || !validGlyphs : !validWall} solveText={phase === 1 ? "Find hieroglyph" : "Group letters"} />
    <ErrorAlert error={error} />

    {result?.round === 1 && <SolverSection title={`Press ${POSITIONS[(result.position ?? 1) - 1]}`} className="border-emerald-500/40"><div className="flex items-center justify-center gap-3 text-lg font-semibold"><OnlyConnectHieroglyph name={result.hieroglyph ?? ""} className="h-14 w-24" />{result.hieroglyph}</div></SolverSection>}
    {result?.round === 2 && <SolverSection title="Language groups" className="border-emerald-500/40"><div className="grid gap-2 sm:grid-cols-3">{result.groups.map((group) => <div key={group.letters.join("")} className="rounded-md border bg-emerald-500/10 p-3 text-center"><div className="text-2xl font-semibold">{group.letters.join(" · ")}</div><div className="mt-1 text-xs text-muted-foreground">{group.language}</div></div>)}</div></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Round 1 uses the current bomb serial number and ports. In round 2, selecting any two complete groups solves the remaining row automatically.</SolverInstructions>
  </SolverLayout>;
}
