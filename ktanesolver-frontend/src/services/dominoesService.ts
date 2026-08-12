import { solveModule } from "../lib/api";
export interface DominoesOutput { operation:string;values:number[];order:number[] }
export const solveDominoes=(r:string,b:string,m:string,dominoes:number[][]):Promise<{output:DominoesOutput;solved:boolean}>=>solveModule(r,b,m,{dominoes});
