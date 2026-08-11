import{solveModule}from"../lib/api";
export interface KudosudokuOutput{solution:number[];numberNames:string[];coordinate:string|null;value:number|null;coding:string|null;submission:string|null;remaining:number}
export const solveKudosudoku=(roundId:string,bombId:string,moduleId:string,grid:number[],coordinate:string|null,coding:string|null):Promise<{output:KudosudokuOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,{grid,coordinate,coding});
