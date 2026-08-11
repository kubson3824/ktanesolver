import { solveModule } from "../lib/api";
export type SwitchColor = "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE" | "PURPLE";
export type SwitchPosition = "UP" | "DOWN";
export interface TheSwitchInput { position: SwitchPosition; topColor: SwitchColor; bottomColor: SwitchColor; restartAttempt: boolean }
export interface TheSwitchOutput { stage: number; timerDigit: number; flipTo: SwitchPosition }
export const solveTheSwitch = (roundId: string, bombId: string, moduleId: string, input: TheSwitchInput): Promise<{ output: TheSwitchOutput; solved: boolean }> => solveModule<TheSwitchInput, { output: TheSwitchOutput; solved: boolean }>(roundId, bombId, moduleId, input);
