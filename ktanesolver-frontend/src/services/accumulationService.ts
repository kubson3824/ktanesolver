import { solveModule } from "../lib/api";

export const ACCUMULATION_COLORS=["BLUE","BROWN","GREEN","GREY","LIME","ORANGE","PINK","RED","WHITE","YELLOW"] as const;
export type AccumulationColor=typeof ACCUMULATION_COLORS[number];
export interface AccumulationStage{backgroundColor:AccumulationColor;digitColors:AccumulationColor[]}
export interface AccumulationOutput{answers:number[];currentAnswer:number;currentStage:number;actions:string[]}
export const solveAccumulation=(roundId:string,bombId:string,moduleId:string,borderColor:AccumulationColor,stages:AccumulationStage[]):Promise<{output:AccumulationOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,{borderColor,stages});
