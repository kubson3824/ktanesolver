import { api, withErrorWrapping } from "../lib/api";

export interface GamepadInput {
  x: number;
  y: number;
}

export interface GamepadOutput {
  sequence: string[];
}

export const solveGamepad = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: GamepadInput,
): Promise<{ output: GamepadOutput }> => withErrorWrapping(async () => {
  const response = await api.post<{ output: GamepadOutput }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input },
  );
  return response.data;
});
