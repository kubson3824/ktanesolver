import { solveModule } from "../lib/api";
export interface RedArrowsOutput { destinationNumber:number; directions:string[]; command:string }
export const solveRedArrows=(roundId:string,bombId:string,moduleId:string,startingNumber:number):Promise<{output:RedArrowsOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,{startingNumber});
