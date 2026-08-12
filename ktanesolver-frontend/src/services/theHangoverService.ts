import { solveModule } from "../lib/api";
export interface TheHangoverInput { drink:string;sick:boolean;slept:string;shots:boolean;kebab:string;travel:string }
export interface TheHangoverOutput { recipe:string[] }
export const solveTheHangover=(r:string,b:string,m:string,input:TheHangoverInput):Promise<{output:TheHangoverOutput;solved:boolean}>=>solveModule(r,b,m,input);
