import { solveModule } from "../lib/api";
export interface DiscoloredSquaresOutput { stage:number;activeColor:string;instruction:string;presses:string[];remembered:string[] }
export const solveDiscoloredSquares=(r:string,b:string,m:string,stage:number,colors:string[]):Promise<{output:DiscoloredSquaresOutput;solved:boolean}>=>solveModule(r,b,m,{stage,colors});
