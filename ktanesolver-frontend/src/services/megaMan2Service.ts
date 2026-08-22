import { solveModule } from "../lib/api";

export const MEGA_MAN_2_MASTERS=["Air Man","Bubble Man","Crash Man","Flash Man","Heat Man","Metal Man","Quick Man","Wood Man"];
export interface MegaMan2Output { eTanks:number; password:string[] }
export const solveMegaMan2=(roundId:string,bombId:string,moduleId:string,displayedMaster:string,displayedWeapon:string,startingMinutes:number):Promise<{output:MegaMan2Output;solved:boolean}> =>
  solveModule(roundId,bombId,moduleId,{displayedMaster,displayedWeapon,startingMinutes});
