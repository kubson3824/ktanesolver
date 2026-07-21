import { solveModule } from "../lib/api";

export const POETRY_GIRLS = ["Melanie", "Jane", "Hana", "Lacy"] as const;
export const POETRY_WORDS = [
  "clarity", "flow", "fatigue", "hollow",
  "energy", "sunshine", "ocean", "reflection", "identity", "black",
  "crowd", "heart", "weather", "words", "past", "solitary",
  "relax", "dance", "weightless", "morality", "gaze", "failure",
  "bunny", "lovely", "romance", "future", "focus", "search",
  "cookies", "compassion", "creation", "patience",
] as const;

export type PoetryGirl = typeof POETRY_GIRLS[number];

export interface PoetryInput {
  girl: PoetryGirl;
  words: string[];
  resetStage: boolean;
}

export interface PoetryOutput {
  stage: number;
  correctWords: string[];
  correctIndexes: number[];
}

export const solvePoetry = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: PoetryInput,
) => solveModule<PoetryInput, { output: PoetryOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
