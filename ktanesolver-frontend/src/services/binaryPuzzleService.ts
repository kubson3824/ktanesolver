import { solveModule } from "../lib/api";
export interface BinaryPuzzleOutput { rows:string[];solution:string }
export const solveBinaryPuzzle=(r:string,b:string,m:string,rows:string[]):Promise<{output:BinaryPuzzleOutput;solved:boolean}>=>solveModule(r,b,m,{rows});
