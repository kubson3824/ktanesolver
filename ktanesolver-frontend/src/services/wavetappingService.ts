import {solveModule} from "../lib/api";
export const WAVETAPPING_COLORS=["Red","Orange","Orange-Yellow","Chartreuse","Lime","Green","Seafoam Green","Cyan-Green","Turquoise","Dark Blue","Indigo","Purple","Purple-Magenta","Magenta","Pink","Grey"];
export interface WavetappingOutput{stage:number;color:string;patternNumber:number;rows:string[];pressCommand:string}
export const solveWavetapping=(roundId:string,bombId:string,moduleId:string,stage:number,currentColor:string,unavailableColors:string[],resetHistory:boolean):Promise<{output:WavetappingOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{stage,currentColor,unavailableColors,resetHistory});
