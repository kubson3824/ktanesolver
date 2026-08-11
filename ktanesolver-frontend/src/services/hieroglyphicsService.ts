import { solveModule } from "../lib/api";
export interface HieroglyphicsOutput { values: Record<string,number>; anubisPosition: string; horusPosition: string; priorityGlyph: string; priorityOccurrences: number; timerDigit: number }
export const solveHieroglyphics = (roundId:string,bombId:string,moduleId:string,glyphNames:string[],rows:string[],sums:number[],anubisGlyphs:string,horusGlyphs:string):Promise<{output:HieroglyphicsOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,{glyphNames,rows,sums,anubisGlyphs,horusGlyphs});
