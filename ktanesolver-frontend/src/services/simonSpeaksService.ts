import { solveModule } from "../lib/api";
export interface SimonSpeaksBubble { shape:number;color:string;word:string } export interface SimonSpeaksOutput { positions:string[];commands:string[];souvenirFacts:string[] }
export const solveSimonSpeaks=(r:string,b:string,m:string,bubbles:SimonSpeaksBubble[],flashes:string[]):Promise<{output:SimonSpeaksOutput;solved:boolean}>=>solveModule(r,b,m,{bubbles,flashes});
