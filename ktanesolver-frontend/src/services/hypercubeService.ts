import {solveModule} from "../lib/api";
export interface HypercubeOutput{stage:number;face:string;targetColor:string;vertex:string}
export const solveHypercube=(roundId:string,bombId:string,moduleId:string,rotations:string[],stage:number,vertexColors:string[]):Promise<{output:HypercubeOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{rotations,stage,vertexColors});
