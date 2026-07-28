import { api, withErrorWrapping } from "../lib/api";

export type LogicGate = "AND" | "OR" | "XOR" | "NAND" | "NOR" | "XNOR";

export interface LogicGatesOutput {
  candidates: LogicGate[][];
  gates: LogicGate[];
  readyToCheck: boolean;
}

export const solveLogicGates = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: { inputs: boolean[]; outputs: boolean[] },
) => withErrorWrapping(async () => (await api.post<{ output: LogicGatesOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
