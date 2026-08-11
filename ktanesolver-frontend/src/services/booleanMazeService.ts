import { solveModule } from "../lib/api";
export interface BooleanMazeOutput { action:string; from:number[]; to:number[]; goal:number[] }
export const solveBooleanMaze=(roundId:string,bombId:string,moduleId:string,display:number,resetPosition:boolean):Promise<{output:BooleanMazeOutput;solved:boolean}>=>(solveModule(roundId,bombId,moduleId,{display,resetPosition}));
