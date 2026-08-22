import { solveModule } from "../lib/api";

export interface MicroIndicator { label: string; lit: boolean }
export interface MicroModulesInput {
  directionalKeypadsId: number; codeMorseId: number; scriptWiresId: number; mathCodeId: number;
  microSerial: string; microIndicators: MicroIndicator[]; microBatteryColor: string; arrows: string[];
  rendererName: string; wireColors: string[]; receivedMorseDigits: string; mathLetters: string;
  firstOperator: string; secondOperator: string;
}
export interface MicroModulesOutput {
  solveOrder: string[]; anyOrder: boolean; cutWires: number[]; keypadPosition: number;
  morseCode: string; mathCode: string; twitchCommands: string[];
}
export const solveMicroModules = (
  roundId: string, bombId: string, moduleId: string, input: MicroModulesInput,
): Promise<{ output: MicroModulesOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, input);
