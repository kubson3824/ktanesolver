import {solveModule} from "../lib/api";

export const ENCRYPTED_EQUATION_SHAPES = ["TRIANGLE","SQUARE","HORIZONTAL_RECTANGLE","X","LEFT_RHOMBUS","OCTAGON","CIRCLE","TRAPEZOID","PENTAGON","HEXAGON","HASH","PLUS","OVAL","RIGHT_RHOMBUS","UPSIDE_DOWN_TRIANGLE","DIAMOND","VERTICAL_RECTANGLE","SIX_POINTED_STAR","FIVE_POINTED_STAR","BLANK"] as const;
export const ENCRYPTED_EQUATION_CHARACTERS = ["A","B","C","D","E","F","G","PI","S","N","HASH","H","O","QUESTION","K","PERCENT","R","EQUALS","SLASH","BACKSLASH"] as const;
export const SURROUND_SYMBOLS = ["NONE","DOT","HORIZONTAL_LINE","VERTICAL_LINE","HOLLOW_DOT"] as const;
export const DIRECTIONS = ["NORTH","EAST","SOUTH","WEST"] as const;
export const CORNER_OPERATIONS = ["NONE","INVERT","ABSOLUTE","SQUARE","CUBE"] as const;
export const MAIN_OPERATIONS = ["ADD","SUBTRACT","MULTIPLY","DIVIDE"] as const;
export type EquationShape = typeof ENCRYPTED_EQUATION_SHAPES[number];
export type CharacterSymbol = typeof ENCRYPTED_EQUATION_CHARACTERS[number];
export type SurroundSymbol = typeof SURROUND_SYMBOLS[number];
export type Direction = typeof DIRECTIONS[number];
export type CornerOperation = typeof CORNER_OPERATIONS[number];
export type MainOperation = typeof MAIN_OPERATIONS[number];
export interface EncryptedOperand { shape: EquationShape; character: CharacterSymbol; surroundSymbol: SurroundSymbol; direction: Direction; cornerOperation: CornerOperation }
export interface EncryptedEquationsOutput { operandValues: string[]; undefined: boolean; answer: string; twitchCommand: string }
export interface EncryptedEquationsInput { leftOperand: EncryptedOperand; leftOperation: MainOperation; middleOperand: EncryptedOperand; rightOperation: MainOperation; rightOperand: EncryptedOperand; parentheses: "LEFT_PAIR"|"RIGHT_PAIR" }
export const solveEncryptedEquations = (roundId:string,bombId:string,moduleId:string,input:EncryptedEquationsInput):Promise<{output:EncryptedEquationsOutput;solved:boolean}> => solveModule(roundId,bombId,moduleId,input);
