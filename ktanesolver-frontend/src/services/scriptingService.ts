import{solveModule}from"../lib/api";
export const SCRIPTING_PROGRAMS=["KTaNE","KMAPI","BombGenerator","ScriptAPI","System","UnityEngine","System.Linq","EncryptedProgram","KMMods","IntGenerator"]as const;
export interface ScriptingOutput{usingNecessary:boolean[];variableType:string;methodType:string;action:string}
export const solveScripting=(roundId:string,bombId:string,moduleId:string,usingPrograms:string[],intValue:number,floatValue:number,boolValue:boolean):Promise<{output:ScriptingOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,{usingPrograms,intValue,floatValue,boolValue});
