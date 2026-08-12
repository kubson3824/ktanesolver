import { solveModule } from "../lib/api";
export interface FactoryMazeInput { maze:number;startRoom:number;roomNames:string[];leftUsesFirstExit:boolean[] }
export interface FactoryMazeOutput { startRoom:string;actions:string[];route:string[] }
export const solveFactoryMaze=(r:string,b:string,m:string,input:FactoryMazeInput):Promise<{output:FactoryMazeOutput;solved:boolean}>=>solveModule(r,b,m,input);
