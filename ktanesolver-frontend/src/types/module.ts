export type ModuleType =
  | "WIRES"
  | "BUTTON"
  | "KEYPADS"
  | "SIMON_SAYS"
  | "WHOS_ON_FIRST"
  | "MEMORY"
  | "MORSE_CODE"
  | "COMPLICATED_WIRES"
  | "WIRE_SEQUENCES"
  | "PASSWORDS"
  | "MAZES";

export interface Module {
  id: string;
  type: ModuleType;
  solved: boolean;
  strikes: number;
  state: Record<string, any>;
  solution: Record<string, any>;
}
