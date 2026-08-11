import { solveModule } from "../lib/api";
export const SPHERE_COLORS=["RED","BLUE","GREEN","ORANGE","PINK","PURPLE","GREY","WHITE"] as const;
export type SphereColor=typeof SPHERE_COLORS[number];
export interface SphereAction{type:"tap"|"hold";value:number}
export interface SphereOutput{actions:SphereAction[];fullSequence:SphereAction[];order:number;holdTimes:number[]}
export const solveSphere=(roundId:string,bombId:string,moduleId:string,colors:SphereColor[],correctResponses:boolean[]):Promise<{output:SphereOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,{colors,correctResponses});
