import { solveModule } from "../lib/api";

export const MRS_BOB_RESPONSES = ["BEAR","BEER","BOWING","CAR","COW_FACE","CRYING","GOLF","HAPPY_FACE","KISS_FACE","MONEY","NAUSEATED","OK_HAND","PIZZA","POO","RED_HEART","RED_ANGER_FACE","SHRUG","TAKEAWAY","TEA","THINKING_FACE","THUMBS_UP","TOOL","WEARY_FACE","WINE"] as const;
export interface NeedyMrsBobOutput { response: string; responsePosition: number; instruction: string }
export const solveNeedyMrsBob = (roundId:string,bombId:string,moduleId:string,message:number,receivedEmoji:number,responseOrder:string[]):Promise<{output:NeedyMrsBobOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{message,receivedEmoji,responseOrder});
