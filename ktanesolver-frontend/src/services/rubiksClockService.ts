import { api, withErrorWrapping } from "../lib/api";

export type RubiksClockAction = "SOLVE_STEP" | "RESET" | "COMPLETE";
export type RubiksClockPin = "TL" | "TR" | "BL" | "BR";
export type RubiksClockFace = RubiksClockPin | "T" | "L" | "C" | "R" | "B";
export interface RubiksClockOutput { pins: RubiksClockPin[]; gear: RubiksClockPin | null; hours: number; step: number }

export const solveRubiksClock = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  action: RubiksClockAction,
  litClock: RubiksClockFace,
  litPin: RubiksClockPin,
) => withErrorWrapping(async () => (await api.post<{ output: RubiksClockOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
  { input: { action, litClock, litPin } },
)).data);
