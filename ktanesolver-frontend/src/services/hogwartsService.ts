import { solveModule } from "../lib/api";
export interface HogwartsEntry { module:string;house:string } export interface HogwartsSelection extends HogwartsEntry { points:number }
export interface HogwartsOutput { selections:HogwartsSelection[];winningHouses:string[] }
export const solveHogwarts=(r:string,b:string,m:string,entries:HogwartsEntry[]):Promise<{output:HogwartsOutput;solved:boolean}>=>solveModule(r,b,m,{entries});
