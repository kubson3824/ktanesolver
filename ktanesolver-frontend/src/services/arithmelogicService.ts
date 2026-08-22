import {solveModule} from "../lib/api";
export const ARITHMELOGIC_SYMBOLS=["©","Ѯ","★","Җ","Ѭ","₠","Ϡ","Ѧ","æ","Ԇ","ϫ","Ӭ","Ͼ","Ѫ","Ҩ","Ϙ","ζ","Ͽ","ƛ","€","☆","œ"];
export const ARITHMELOGIC_OPERATORS=["AND","OR","XOR","IMPLIES","NAND","NOR","XNOR","IMPLIED_BY"] as const;
export type ArithmelogicOperator=typeof ARITHMELOGIC_OPERATORS[number];
export interface ArithmelogicOutput{offsets:number[];selectedValues:number[];adjustedValues:number[];truthValues:boolean[];twitchCommand:string}
export interface ArithmelogicInput{symbolA:number;symbolB:number;symbolC:number;submitSymbol:number;leftOperator:ArithmelogicOperator;rightOperator:ArithmelogicOperator;leftGrouped:boolean;valuesA:number[];valuesB:number[];valuesC:number[]}
export const solveArithmelogic=(roundId:string,bombId:string,moduleId:string,input:ArithmelogicInput):Promise<{output:ArithmelogicOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,input);
