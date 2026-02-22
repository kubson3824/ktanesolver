import { lazy, type ComponentType } from "react";
import { ModuleType } from "../../types";
import type { SolverProps } from "./types";

type SolverLoader = () => Promise<{ default: ComponentType<SolverProps> }>;

/**
 * Registry mapping every ModuleType to its lazy-loaded solver component.
 * Adding a new solver only requires adding one entry here.
 */
export const solverRegistry: Partial<Record<ModuleType, SolverLoader>> = {
  [ModuleType.WIRES]: () => import("./WireSolver"),
  [ModuleType.BUTTON]: () => import("./ButtonSolver"),
  [ModuleType.KEYPADS]: () => import("./KeypadsSolver"),
  [ModuleType.MAZES]: () => import("./MazeSolver"),
  [ModuleType.MEMORY]: () => import("./MemorySolver"),
  [ModuleType.MORSE_CODE]: () => import("./MorseCodeSolver"),
  [ModuleType.PASSWORDS]: () => import("./PasswordSolver"),
  [ModuleType.SIMON_SAYS]: () => import("./SimonSolver"),
  [ModuleType.WHOS_ON_FIRST]: () => import("./WhosOnFirstSolver"),
  [ModuleType.COMPLICATED_WIRES]: () => import("./ComplicatedWiresSolver"),
  [ModuleType.WIRE_SEQUENCES]: () => import("./WireSequencesSolver"),
  [ModuleType.COLOR_FLASH]: () => import("./ColorFlashSolver"),
  [ModuleType.PIANO_KEYS]: () => import("./PianoKeysSolver"),
  [ModuleType.SEMAPHORE]: () => import("./SemaphoreSolver"),
  [ModuleType.MATH]: () => import("./MathSolver"),
  [ModuleType.EMOJI_MATH]: () => import("./EmojiMathSolver"),
  [ModuleType.SWITCHES]: () => import("./SwitchesSolver"),
  [ModuleType.TWO_BITS]: () => import("./TwoBitsSolver"),
  [ModuleType.WORD_SCRAMBLE]: () => import("./WordScrambleSolver"),
  [ModuleType.ANAGRAMS]: () => import("./AnagramsSolver"),
  [ModuleType.COMBINATION_LOCK]: () => import("./CombinationLockSolver"),
  [ModuleType.ROUND_KEYPAD]: () => import("./RoundKeypadSolver"),
  [ModuleType.LISTENING]: () => import("./ListeningSolver"),
  [ModuleType.FOREIGN_EXCHANGE_RATES]: () => import("./ForeignExchangeSolver"),
  [ModuleType.ORIENTATION_CUBE]: () => import("./OrientationCubeSolver"),
  [ModuleType.MORSEMATICS]: () => import("./MorsematicsSolver"),
  [ModuleType.CONNECTION_CHECK]: () => import("./ConnectionCheckSolver"),
  [ModuleType.LETTER_KEYS]: () => import("./LetterKeysSolver"),
  [ModuleType.LOGIC]: () => import("./LogicSolver"),
  [ModuleType.FORGET_ME_NOT]: () => import("./ForgetMeNotSolver"),
  [ModuleType.ASTROLOGY]: () => import("./AstrologySolver"),
  [ModuleType.MYSTIC_SQUARE]: () => import("./MysticSquareSolver"),
  [ModuleType.CRAZY_TALK]: () => import("./CrazyTalkSolver"),
  [ModuleType.ADVENTURE_GAME]: () => import("./AdventureGameSolver"),
  [ModuleType.PLUMBING]: () => import("./PlumbingSolver"),
  [ModuleType.CRUEL_PIANO_KEYS]: () => import("./CruelPianoKeysSolver"),
  [ModuleType.SAFETY_SAFE]: () => import("./SafetySafeSolver"),
  [ModuleType.CRYPTOGRAPHY]: () => import("./CryptographySolver"),
  [ModuleType.TURN_THE_KEY]: () => import("./TurnTheKeySolver"),
  [ModuleType.TURN_THE_KEYS]: () => import("./TurnTheKeysSolver"),
  [ModuleType.CHESS]: () => import("./ChessSolver"),
  [ModuleType.MOUSE_IN_THE_MAZE]: () => import("./MouseInTheMazeSolver"),
  [ModuleType.THREE_D_MAZE]: () => import("./ThreeDMazeSolver"),
};

/**
 * Returns a React.lazy component for the given module type, or null if no
 * solver is registered.
 */
export function getLazySolver(moduleType: ModuleType) {
  const loader = solverRegistry[moduleType];
  if (!loader) return null;
  return lazy(loader);
}
