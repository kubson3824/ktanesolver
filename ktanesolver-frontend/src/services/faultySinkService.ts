import { solveModule } from "../lib/api";
export type SinkFault = "BLACK_DRAIN"|"BLUE_DRAIN"|"PINK_TEXTURE"|"ALL_BLACK"|"UPSIDE_DOWN";
export type SinkMaterial = "COPPER"|"STAINLESS_STEEL"|"GOLD_PLATED"|"PVC";
export type SinkControl = "COLD"|"HOT"|"FAUCET"|"PIPE"|"BASIN";
export type SinkRotation = "NONE"|"AFTER_THREE_CORRECT"|"CLOCKWISE"|"COUNTERCLOCKWISE";
export interface FaultySinkInput { fault: SinkFault; knobMaterial: SinkMaterial; faucetMaterial: SinkMaterial; pipeMaterial: SinkMaterial; missingKnob: SinkControl|null; textureSource: SinkControl|null; hotReplacement: SinkControl|null; rotation: SinkRotation; spinningControl: SinkControl|null; completedCorrectKnobs: number }
export interface FaultySinkOutput { actions: string[]; instruction: string; twitchCommand: string }
export const solveFaultySink=(roundId:string,bombId:string,moduleId:string,input:FaultySinkInput)=>solveModule<FaultySinkInput,{output:FaultySinkOutput;solved:boolean}>(roundId,bombId,moduleId,input);
