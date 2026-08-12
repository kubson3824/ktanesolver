import { solveModule } from "../lib/api";
export interface BrokenGuitarChordsOutput { chord:string;brokenString:number;positions:string[];notes:string[] }
export const solveBrokenGuitarChords=(r:string,b:string,m:string,chord:string,brokenString:number):Promise<{output:BrokenGuitarChordsOutput;solved:boolean}>=>solveModule(r,b,m,{chord,brokenString});
