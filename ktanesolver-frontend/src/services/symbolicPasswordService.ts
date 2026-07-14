import { api, withErrorWrapping } from "../lib/api";
import type { KeypadSymbol } from "./keypadsService";

export interface SymbolicPasswordOutput {
  targetSymbols: KeypadSymbol[];
  moves: string[];
}

export const solveSymbolicPassword = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  symbols: KeypadSymbol[],
) => withErrorWrapping(async () => (await api.post<{ output: SymbolicPasswordOutput; solved: boolean }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input: { symbols } },
)).data);
