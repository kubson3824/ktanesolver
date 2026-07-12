import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { ModuleCategory, type ModuleCatalogItem, ModuleType } from "../../types";
import type { SolverProps } from "./types";

type SolverLoader = () => Promise<{ default: ComponentType<SolverProps> }>;
type SolverRegistryEntry = {
  load: SolverLoader;
  isNeedy?: boolean;
};

/**
 * Registry mapping module types with a frontend UI to lazy-loaded solver components.
 * Backend-only modules still appear in the catalog and fall back to "Coming soon".
 */
export const solverRegistry: Partial<Record<string, SolverRegistryEntry>> = {
  [ModuleType.WIRES]: { load: () => import("./WireSolver") },
  [ModuleType.BUTTON]: { load: () => import("./ButtonSolver") },
  [ModuleType.KEYPADS]: { load: () => import("./KeypadsSolver") },
  [ModuleType.MAZES]: { load: () => import("./MazeSolver") },
  [ModuleType.MEMORY]: { load: () => import("./MemorySolver") },
  [ModuleType.MORSE_CODE]: { load: () => import("./MorseCodeSolver") },
  [ModuleType.PASSWORDS]: { load: () => import("./PasswordSolver") },
  [ModuleType.SIMON_SAYS]: { load: () => import("./SimonSolver") },
  [ModuleType.WHOS_ON_FIRST]: { load: () => import("./WhosOnFirstSolver") },
  [ModuleType.COMPLICATED_WIRES]: { load: () => import("./ComplicatedWiresSolver") },
  [ModuleType.WIRE_SEQUENCES]: { load: () => import("./WireSequencesSolver") },
  [ModuleType.COLOR_FLASH]: { load: () => import("./ColorFlashSolver") },
  [ModuleType.PIANO_KEYS]: { load: () => import("./PianoKeysSolver") },
  [ModuleType.SEMAPHORE]: { load: () => import("./SemaphoreSolver") },
  [ModuleType.MATH]: { load: () => import("./MathSolver") },
  [ModuleType.PERSPECTIVE_PEGS]: { load: () => import("./PerspectivePegsSolver") },
  [ModuleType.EMOJI_MATH]: { load: () => import("./EmojiMathSolver") },
  [ModuleType.SWITCHES]: { load: () => import("./SwitchesSolver") },
  [ModuleType.TWO_BITS]: { load: () => import("./TwoBitsSolver") },
  [ModuleType.WORD_SCRAMBLE]: { load: () => import("./WordScrambleSolver") },
  [ModuleType.ANAGRAMS]: { load: () => import("./AnagramsSolver") },
  [ModuleType.COMBINATION_LOCK]: { load: () => import("./CombinationLockSolver") },
  [ModuleType.ROUND_KEYPAD]: { load: () => import("./RoundKeypadSolver") },
  [ModuleType.NUMBER_PAD]: { load: () => import("./NumberPadSolver") },
  [ModuleType.LISTENING]: { load: () => import("./ListeningSolver") },
  [ModuleType.FOREIGN_EXCHANGE_RATES]: { load: () => import("./ForeignExchangeSolver") },
  [ModuleType.ORIENTATION_CUBE]: { load: () => import("./OrientationCubeSolver") },
  [ModuleType.MORSEMATICS]: { load: () => import("./MorsematicsSolver") },
  [ModuleType.CONNECTION_CHECK]: { load: () => import("./ConnectionCheckSolver") },
  [ModuleType.LETTER_KEYS]: { load: () => import("./LetterKeysSolver") },
  [ModuleType.LOGIC]: { load: () => import("./LogicSolver") },
  [ModuleType.FORGET_ME_NOT]: { load: () => import("./ForgetMeNotSolver") },
  [ModuleType.ASTROLOGY]: { load: () => import("./AstrologySolver") },
  [ModuleType.MYSTIC_SQUARE]: { load: () => import("./MysticSquareSolver") },
  [ModuleType.CRAZY_TALK]: { load: () => import("./CrazyTalkSolver") },
  [ModuleType.ADVENTURE_GAME]: { load: () => import("./AdventureGameSolver") },
  [ModuleType.PLUMBING]: { load: () => import("./PlumbingSolver") },
  [ModuleType.CRUEL_PIANO_KEYS]: { load: () => import("./CruelPianoKeysSolver") },
  [ModuleType.SAFETY_SAFE]: { load: () => import("./SafetySafeSolver") },
  [ModuleType.CRYPTOGRAPHY]: { load: () => import("./CryptographySolver") },
  [ModuleType.CAESAR_CIPHER]: { load: () => import("./CaesarCipherSolver") },
  [ModuleType.TURN_THE_KEY]: { load: () => import("./TurnTheKeySolver") },
  [ModuleType.TURN_THE_KEYS]: { load: () => import("./TurnTheKeysSolver") },
  [ModuleType.CHESS]: { load: () => import("./ChessSolver") },
  [ModuleType.MOUSE_IN_THE_MAZE]: { load: () => import("./MouseInTheMazeSolver") },
  [ModuleType.SILLY_SLOTS]: { load: () => import("./SillySlotsSolver") },
  [ModuleType.THREE_D_MAZE]: { load: () => import("./ThreeDMazeSolver") },
  [ModuleType.SIMON_STATES]: { load: () => import("./SimonStatesSolver") },
  [ModuleType.LAUNDRY]: { load: () => import("./LaundrySolver") },
  [ModuleType.PROBING]: { load: () => import("./ProbingSolver") },
  [ModuleType.ALPHABET]: { load: () => import("./AlphabetSolver") },
  [ModuleType.MICROCONTROLLER]: { load: () => import("./MicrocontrollerSolver") },
  [ModuleType.MURDER]: { load: () => import("./MurderSolver") },
  [ModuleType.GAMEPAD]: { load: () => import("./GamepadSolver") },
  [ModuleType.TIC_TAC_TOE]: { load: () => import("./TicTacToeSolver") },
  [ModuleType.MONSPLODE_FIGHT]: { load: () => import("./MonsplodeFightSolver") },
  [ModuleType.SHAPE_SHIFT]: { load: () => import("./ShapeShiftSolver") },
  [ModuleType.FOLLOW_THE_LEADER]: { load: () => import("./FollowTheLeaderSolver") },
  [ModuleType.FRIENDSHIP]: { load: () => import("./FriendshipSolver") },
  [ModuleType.THE_BULB]: { load: () => import("./TheBulbSolver") },
  [ModuleType.BLIND_ALLEY]: { load: () => import("./BlindAlleySolver") },
  [ModuleType.SEA_SHELLS]: { load: () => import("./SeaShellsSolver") },
  [ModuleType.ENGLISH_TEST]: { load: () => import("./EnglishTestSolver") },
  [ModuleType.ROCK_PAPER_SCISSORS_LIZARD_SPOCK]: { load: () => import("./RockPaperScissorsLizardSpockSolver") },
  [ModuleType.SQUARE_BUTTON]: { load: () => import("./SquareButtonSolver") },
  [ModuleType.KNOBS]: { load: () => import("./KnobsSolver"), isNeedy: true },
  [ModuleType.VENTING_GAS]: { load: () => import("./VentingGasSolver"), isNeedy: true },
  [ModuleType.CAPACITOR_DISCHARGE]: { load: () => import("./CapacitorDischargeSolver"), isNeedy: true },
};

/**
 * Stable map of pre-built React.lazy() references for registered solver UIs.
 * Built once at module load time so the same moduleType always returns the
 * identical lazy() reference, preventing unnecessary remounts.
 */
export const lazySolverRegistry = Object.fromEntries(
  Object.entries(solverRegistry).flatMap(([moduleType, entry]) =>
    entry ? [[moduleType, lazy(entry.load)] as const] : [],
  ),
) as Partial<Record<string, LazyExoticComponent<ComponentType<SolverProps>>>>;

function isNeedyCategory(category: ModuleCategory): boolean {
  return (
    category === ModuleCategory.VANILLA_NEEDY ||
    category === ModuleCategory.MODDED_NEEDY
  );
}

/**
 * Returns true if the given module type is a needy module, using the catalog
 * as the primary source of truth (category-based) and falling back to the
 * registry's isNeedy flag when the catalog entry is unavailable.
 */
export function isNeedyModuleType(
  moduleType: string,
  catalogByType: Record<string, ModuleCatalogItem | undefined>,
): boolean {
  const catalogEntry = catalogByType[moduleType];
  if (catalogEntry) {
    return isNeedyCategory(catalogEntry.category);
  }

  const registryEntry = solverRegistry[moduleType];
  return Boolean(registryEntry?.isNeedy);
}

/**
 * Returns a stable React.lazy component for the given module type, or null if
 * no solver is registered. Always returns the same reference for the same type.
 */
export function getLazySolver(moduleType?: string) {
  if (!moduleType) return null;
  return lazySolverRegistry[moduleType] ?? null;
}
