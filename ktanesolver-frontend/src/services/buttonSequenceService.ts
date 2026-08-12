import { api, withErrorWrapping } from "../lib/api";

export const BUTTON_SEQUENCE_COLORS = ["RED", "YELLOW", "BLUE", "WHITE"] as const;
export const BUTTON_SEQUENCE_LABELS = ["ABORT", "DETONATE", "HOLD", "PRESS"] as const;
export const BUTTON_SEQUENCE_SHAPES = ["CIRCLE", "SQUARE", "HEXAGON"] as const;

export type ButtonSequenceColor = typeof BUTTON_SEQUENCE_COLORS[number];
export type ButtonSequenceLabel = typeof BUTTON_SEQUENCE_LABELS[number];
export type ButtonSequenceShape = typeof BUTTON_SEQUENCE_SHAPES[number];
export type ButtonSequenceAction = "SKIP" | "PRESS" | "HOLD";

export interface ButtonSequenceButton {
  color: ButtonSequenceColor;
  label: ButtonSequenceLabel;
  shape: ButtonSequenceShape;
}

export interface ButtonSequenceOutput {
  panel: number;
  actions: ButtonSequenceAction[];
  colorOccurrences: Record<ButtonSequenceColor, number>;
}

export const solveButtonSequence = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  panel: number,
  buttons: ButtonSequenceButton[],
): Promise<{ output: ButtonSequenceOutput; solved: boolean }> => withErrorWrapping(async () => {
  const response = await api.post<{ output: ButtonSequenceOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input: { panel, buttons } },
  );
  return response.data;
});
