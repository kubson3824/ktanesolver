import { solveModule } from "../lib/api";

export interface RequestedModuleResponse {
  output: Record<string, unknown>;
  solved: boolean;
}

export const solveRequestedModule = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: Record<string, unknown>,
): Promise<RequestedModuleResponse> =>
  solveModule(roundId, bombId, moduleId, input);
