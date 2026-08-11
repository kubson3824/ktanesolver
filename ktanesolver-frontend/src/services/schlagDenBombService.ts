import { solveModule } from "../lib/api";
export interface SchlagDenBombOutput { contestantGames:number[];bombGames:number[];unplayedGames:number[];gameTypes:string[];contestantName:string;contestantScore:number;bombScore:number }
export const solveSchlagDenBomb=(roundId:string,bombId:string,moduleId:string,contestantName:string,contestantScore:number,bombScore:number):Promise<{output:SchlagDenBombOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,{contestantName,contestantScore,bombScore});
