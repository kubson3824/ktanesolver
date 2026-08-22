import {solveModule} from "../lib/api";
export const BRUSH_STROKES_COLORS=["RED","ORANGE","YELLOW","LIME","GREEN","CYAN","SKY","BLUE","PURPLE","MAGENTA","BROWN","WHITE","GRAY","BLACK","PINK"] as const;
export type BrushStrokesColor=typeof BRUSH_STROKES_COLORS[number];
export interface BrushStrokesOutput{referenceManual:string;rawKeyNumber:number;symbolNumber:number;strokes:string[];twitchCommand:string}
export const solveBrushStrokes=(roundId:string,bombId:string,moduleId:string,keyColor:BrushStrokesColor,solvableModuleCount:number|null):Promise<{output:BrushStrokesOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{keyColor,solvableModuleCount});
