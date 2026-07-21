import { solveModule } from "../lib/api";

export interface MortalKombatInput {
  player: string;
  opponent: string;
}

export interface MortalKombatMove {
  name: string;
  controls: string;
}

export interface MortalKombatOutput {
  attacks: MortalKombatMove[];
  fatality: MortalKombatMove;
}

export const solveMortalKombat = (roundId: string, bombId: string, moduleId: string, input: MortalKombatInput) =>
  solveModule<MortalKombatInput, { output: MortalKombatOutput; solved: boolean }>(roundId, bombId, moduleId, input);
