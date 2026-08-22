import {solveModule} from "../lib/api";
export interface GraphicMemoryShape{color:string;shape:string}
export interface GraphicMemoryOutput{pressedPosition:string;pressesCompleted:number;nextValidPositions:string[]}
export const solveGraphicMemory=(roundId:string,bombId:string,moduleId:string,pressedPosition:string,shapes:GraphicMemoryShape[],resetHistory:boolean):Promise<{output:GraphicMemoryOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{pressedPosition,shapes,resetHistory});
