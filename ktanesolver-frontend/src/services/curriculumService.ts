import { solveModule } from "../lib/api";

export type CurriculumClassPair =
  | "PHYSICS_MATHS"
  | "PHILOSOPHY_LITERATURE"
  | "PROGRAMMING_ECONOMY"
  | "LINGUISTICS_MANAGEMENT"
  | "LOGIC_ELECTRONICS";

export interface CurriculumButtonSchedule {
  classPair: CurriculumClassPair;
  sections: boolean[][];
  currentSection: number;
}

export interface CurriculumInput {
  buttons: CurriculumButtonSchedule[];
}

export interface CurriculumOutput {
  buttonStates: number[];
  clicks: number[];
  classes: string[];
  classSections: number[];
  condition: string;
  bookworm: boolean;
  conflicts: number;
}

export const solveCurriculum = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: CurriculumInput,
) => solveModule<CurriculumInput, { output: CurriculumOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
