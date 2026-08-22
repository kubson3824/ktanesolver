import { solveModule } from "../lib/api";

export const DEALMAKER_ITEMS=[
  {value:"SHILLING",label:"Shilling",countable:true},{value:"WOOD",label:"Wood",countable:false},{value:"IRON",label:"Iron",countable:false},{value:"STEEL",label:"Steel",countable:false},{value:"CAN_OF_WORMS",label:"Can of worms",countable:true},{value:"COPPER",label:"Copper",countable:false},{value:"COIN",label:"Coin",countable:true},{value:"CAT",label:"Cat",countable:true},{value:"FAKE_GOLD_INGOT_WITH_COPPER_CORE",label:"Fake gold ingot with copper core",countable:true},{value:"FLUFFY_ALPACA",label:"Fluffy alpaca",countable:true},{value:"ABORT_BUTTON",label:"Abort button",countable:true},{value:"EMPTY_BOMB_CASE",label:"Empty bomb case",countable:true},{value:"OLD_PHONE",label:"Old phone",countable:true},{value:"HYPERCUBE",label:"Hypercube",countable:true},
] as const;
export const DEALMAKER_UNITS=[
  {value:"GRAM",label:"gram(s) of",countable:false},{value:"ESTERLING",label:"esterling(s) of",countable:false},{value:"PENNYWEIGHT",label:"pennyweight(s) of",countable:false},{value:"KILOGRAM",label:"kilogram(s) of",countable:false},{value:"STONEWEIGHT",label:"stoneweight(s) of",countable:false},{value:"BABYLONIAN_TALENT",label:"Babylonian talent(s) of",countable:false},{value:"HUNDREDWEIGHT",label:"hundredweight(s) of",countable:false},{value:"SINGLE",label:"item(s)",countable:true},{value:"FULL_HAND",label:"full hand(s) of",countable:true},{value:"DOZEN",label:"dozen",countable:true},{value:"SCORE",label:"score(s) of",countable:true},{value:"GREAT_HUNDRED",label:"great hundred",countable:true},{value:"SMALL_GROSS",label:"small gross",countable:true},{value:"GROSS",label:"gross",countable:true},{value:"GREAT_GROSS",label:"great gross",countable:true},
] as const;
export const DEALMAKER_CURRENCIES=["SEK","NOK","DKK","PLN","PEN","WST","BYN","AUD","CAD","CHF","USD","EUR","IMP","GBP"] as const;
export type DealmakerKind="BUY"|"SELL";
export type DealmakerItem=typeof DEALMAKER_ITEMS[number]["value"];
export type DealmakerUnit=typeof DEALMAKER_UNITS[number]["value"];
export type DealmakerCurrency=typeof DEALMAKER_CURRENCIES[number];
export interface DealmakerInput{kind:DealmakerKind;quantity:number;unit:DealmakerUnit;item:DealmakerItem;price:number;currency:DealmakerCurrency}
export interface DealmakerOutput{goodDeal:boolean;action:"deal"|"nodeal";goodsValueEur:number;offerValueEur:number}
export const solveDealmaker=(roundId:string,bombId:string,moduleId:string,input:DealmakerInput):Promise<{output:DealmakerOutput;solved:boolean}>=>solveModule(roundId,bombId,moduleId,input);
