import { solveModule } from "../lib/api";
export interface ChristmasPresentsOutput { valueX: number; valueY: number; valueZ: number; hour: number }
export interface ChristmasPresentsCounts { auntieMarge: number; uncleSimon: number; cousinBob: number; grannyMay: number; greatUncleBertie: number }
export const solveChristmasPresents = (roundId: string, bombId: string, moduleId: string, counts: ChristmasPresentsCounts): Promise<{ output: ChristmasPresentsOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, counts);
