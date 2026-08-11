import{solveModule}from"../lib/api";
export const T_WORDS=["Tautochronous","Tarantella","Tenderometer","Tellurometer","Tectosphere","Tessaraglot","Tamandua","Tabernacular","Tachygraphy","Tangoreceptor","Tatterdemalion","Teichoscopy","Terpsichorean","Tellurian","Taphephobia","Tabernacle","Tachyphrasia","Tauromorphous","Taphrogenesis","Tablature"]as const;
export const T_WORD_LED_COLORS=["BLUE","GREEN","ORANGE","RED","PURPLE"]as const;
export type TWordLedColor=typeof T_WORD_LED_COLORS[number];
export interface TWordsOutput{column:number;positions:number[];orderedWords:string[]}
export const solveTWords=(roundId:string,bombId:string,moduleId:string,ledColor:TWordLedColor,words:string[]):Promise<{output:TWordsOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,{ledColor,words});
