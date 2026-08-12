import { solveModule } from "../lib/api";
export interface RegularCrazyTalkPhrase { phrase:string;displayedDigit:number }
export interface RegularCrazyTalkOutput { position:number;phrase:string;digit:number;hold:number;release:number;embellishment:string }
export const solveRegularCrazyTalk=(r:string,b:string,m:string,phrases:RegularCrazyTalkPhrase[]):Promise<{output:RegularCrazyTalkOutput;solved:boolean}>=>solveModule(r,b,m,{phrases});
