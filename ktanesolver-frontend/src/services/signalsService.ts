import { solveModule } from "../lib/api";
export type SignalsSwitchState = "UP" | "CENTER_NEXT_DOWN" | "DOWN" | "CENTER_NEXT_UP";
export interface SignalsSwitchWiring { coefficient: number; upValue: number; centerValue: number; downValue: number; currentState: SignalsSwitchState }
export interface SignalsOutput { targetCoefficients: number[]; targetPositions: string[]; clicks: string[] }
export const solveSignals = (roundId:string,bombId:string,moduleId:string,inputFigure:number,strikes:number,switches:SignalsSwitchWiring[]):Promise<{output:SignalsOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{inputFigure,strikes,switches});
