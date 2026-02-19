import { api, withErrorWrapping } from "../lib/api";

export type LogicConnective =
  | "AND"
  | "OR"
  | "XOR"
  | "NAND"
  | "NOR"
  | "XNOR"
  | "IMPL_LEFT"
  | "IMPL_RIGHT";

export interface LogicRowInput {
  letter1: string;
  letter2: string;
  letter3: string;
  connective1: LogicConnective;
  connective2: LogicConnective;
  negated1: boolean;
  negated2: boolean;
  negated3: boolean;
  leftGrouped: boolean;
}

export interface LogicInput {
  rows: LogicRowInput[];
}

export interface LogicOutput {
  answers: boolean[];
}

export interface LogicSolveRequest {
  input: LogicInput;
}

export interface LogicSolveResponse {
  output: LogicOutput;
  solved?: boolean;
}

export const solveLogic = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: LogicSolveRequest
): Promise<LogicSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<LogicSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input
    );
    return response.data;
  });
};
