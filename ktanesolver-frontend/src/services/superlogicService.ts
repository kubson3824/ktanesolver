import { api, withErrorWrapping } from "../lib/api";
import type { LogicConnective } from "./logicService";

export interface SuperlogicEquationInput {
  operand1: string;
  operand2: string;
  connective: LogicConnective;
  negated1: boolean;
  negated2: boolean;
  negatedExpression: boolean;
}

export interface SuperlogicInput {
  equations: SuperlogicEquationInput[];
}

export interface SuperlogicOutput {
  values: boolean[];
}

interface SuperlogicSolveResponse {
  output: SuperlogicOutput;
}

export const solveSuperlogic = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: SuperlogicInput,
): Promise<SuperlogicSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<SuperlogicSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input },
    );
    return response.data;
  });
};
