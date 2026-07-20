import { api, withErrorWrapping } from "../lib/api";

export const HUNTING_CLUES = ["o_", "W", "z_", "A", "M", "U", "f_", "H"] as const;
export const HUNTING_BUTTONS = ["h_", "R", "e_", "v_", "F", "b_", "K", "t_", "Q", "p_", "u_", "X", "n_", "B", "S", "I"] as const;
export type HuntingSymbol = typeof HUNTING_CLUES[number] | typeof HUNTING_BUTTONS[number];

export interface HuntingOutput {
  stage: number;
  decoys: HuntingSymbol[];
  safeButton: number | null;
}

export const solveHunting = async (
  roundId: string, bombId: string, moduleId: string, stage: number,
  leftSymbol: HuntingSymbol, rightSymbol: HuntingSymbol, buttonSymbols: HuntingSymbol[],
): Promise<{ output: HuntingOutput; solved: boolean }> => withErrorWrapping(async () => {
  const response = await api.post<{ output: HuntingOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input: { stage, leftSymbol, rightSymbol, buttonSymbols } },
  );
  return response.data;
});
