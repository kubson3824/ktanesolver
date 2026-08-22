import { solveModule } from "../lib/api";
export interface TransmittedMorseInput { receivedMessage: string; topLed: string; bottomLed: string }
export interface TransmittedMorseEntry { slider: number; position: number }
export interface TransmittedMorseOutput { stage: number; receivedMessage: string; effectiveMessage: string; reversed: boolean; entries: TransmittedMorseEntry[]; nextStage: number }
export const solveTransmittedMorse = (roundId: string, bombId: string, moduleId: string, input: TransmittedMorseInput) => solveModule<TransmittedMorseInput, { output: TransmittedMorseOutput; solved: boolean }>(roundId, bombId, moduleId, input);
