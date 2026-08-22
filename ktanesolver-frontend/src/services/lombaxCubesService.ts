import { solveModule } from "../lib/api";

export interface LombaxCubesOutput { cubeValues: number[]; cubeX: string; cubeY: string; timerDigit: number }
export const solveLombaxCubes = (roundId: string, bombId: string, moduleId: string, buttonLetters: string, buttonColor: string, cubeFaces: string[]): Promise<{ output: LombaxCubesOutput; solved: boolean }> =>
  solveModule(roundId, bombId, moduleId, { buttonLetters, buttonColor, cubeFaces });
