import { solveModule } from "../lib/api";

export const MODULE_HOMEWORK_SUBJECTS = ["Who's On First", "Memory", "Morse Code", "Complicated Wires", "The Maze", "Passwords", "The Knob", "Hexamaze", "The Swan", "Poker", "Turn The Keys", "Two Bits", "Semaphore", "Souvenir", "Random Number Generator", "Answering Questions", "Button Masher", "Hex To Decimal", "QR Code", "Astrology", "Microcontroller", "Translated Modules", "Crazy Talk", "Ice Cream", "Light Cycle", "Blackjack", "British Slang", "Periodic Table", "T-Words", "Snooker", "Benedict Cumberbatch"] as const;
export interface ModuleHomeworkOutput { subject: string; answer: string; baseAnswer: number; baseNumber: number; school: string; button: number }
export const solveModuleHomework = (roundId: string, bombId: string, moduleId: string, subject: string): Promise<{ output: ModuleHomeworkOutput; solved: boolean }> => solveModule(roundId, bombId, moduleId, { subject });
