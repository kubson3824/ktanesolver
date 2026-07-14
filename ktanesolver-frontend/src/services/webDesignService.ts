import { solveModule } from "../lib/api";

export interface WebDesignInput {
  css: string;
  coloredButtons: boolean;
}

export interface WebDesignOutput {
  site: string;
  colorTarget: string;
  rawScore: number;
  adjustedScore: number;
  digitalRoot: number;
  answer: "ACCEPT" | "CONSIDER" | "REJECT";
}

export const solveWebDesign = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: WebDesignInput,
) => solveModule<WebDesignInput, { output: WebDesignOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
