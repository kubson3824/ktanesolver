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
  [ModuleType.FORGET_ME_NOT]: () => import("./ForgetMeNotSolver"),
  [ModuleType.ASTROLOGY]: () => import("./AstrologySolver"),
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
