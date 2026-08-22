import {solveModule} from "../lib/api";

export const SIMON_STORES_COLORS = ["R","G","B","C","M","Y"] as const;
export type SimonStoresColor = typeof SIMON_STORES_COLORS[number];
export interface SimonStoresOutput { stage:number; stageValues:number[]; result:number; balancedTernary:string; executionOrder:string; signedPresses:string[]; twitchCommand:string }
export const solveSimonStores = (roundId:string,bombId:string,moduleId:string,stage:number,buttonOrder:SimonStoresColor[],flashes:string[]):Promise<{output:SimonStoresOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{stage,buttonOrder,flashes});
