import {solveModule} from "../lib/api";
export interface StareEye{color:string;type:string;background:string;open:boolean}export interface TheStareOutput{desiredState:"OPEN"|"CLOSED";toggleNeeded:boolean;activeTimerDigits:number[];exampleTime:string|null;confirm:boolean}
export const solveTheStare=(roundId:string,bombId:string,moduleId:string,eyes:StareEye[],targetIndex:number,initialMinutes:number,disarmedModules:number,confirm:boolean):Promise<{output:TheStareOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{eyes,targetIndex,initialMinutes,disarmedModules,confirm});
