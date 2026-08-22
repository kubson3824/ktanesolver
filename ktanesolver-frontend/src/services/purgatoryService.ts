import { solveModule } from "../lib/api";
export interface PurgatoryOutput{destination:"HEAVEN"|"HELL"|"EITHER";timing:"NOW"|"ON_TWO"|"AT_END";clickCount:number}
export const solvePurgatory=(roundId:string,bombId:string,moduleId:string,stage:number,ledColor:string,personName:string,flickering:boolean):Promise<{output:PurgatoryOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{stage,ledColor,personName,flickering});
