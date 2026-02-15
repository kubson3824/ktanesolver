import { api, withErrorWrapping } from '../lib/api';

export interface FlagAngles {
  leftFlagAngle: number;
  rightFlagAngle: number;
}

export interface SemaphoreInput {
  sequence: FlagAngles[];
}

export interface SemaphoreOutput {
  missingCharacter: string;
  resolved: boolean;
}

/** Single source of truth: angles -> display label (matches SemaphoreFlagSelector positions) */
const ANGLE_PAIR_TO_LABEL: Map<string, string> = new Map([
  ['0-45', 'NUMERALS'],
  ['0-90', 'LETTERS'],
  ['225-180', 'A (1)'],
  ['270-180', 'B (2)'],
  ['315-180', 'C (3)'],
  ['0-180', 'D (4)'],
  ['180-45', 'E (5)'],
  ['180-90', 'F (6)'],
  ['180-135', 'G (7)'],
  ['270-225', 'H (8)'],
  ['315-225', 'I (9)'],
  ['225-0', 'K (0)'],
  ['225-45', 'L'],
  ['225-90', 'M'],
  ['225-135', 'N'],
  ['270-315', 'O'],
  ['270-0', 'P'],
  ['270-45', 'Q'],
  ['270-90', 'R'],
  ['270-135', 'S'],
  ['315-0', 'T'],
  ['315-45', 'U'],
  ['0-135', 'V'],
  ['45-90', 'W'],
  ['45-135', 'X'],
  ['315-90', 'Y'],
  ['135-90', 'Z'],
]);

/**
 * Returns a display label for a semaphore position (letter, number, or control).
 * Used when restoring state so the Sequence Builder shows letters/numbers instead of raw angles.
 */
export function getDisplayLabel(leftFlagAngle: number, rightFlagAngle: number): string {
  const key = `${leftFlagAngle}-${rightFlagAngle}`;
  return ANGLE_PAIR_TO_LABEL.get(key) ?? `(${leftFlagAngle}°, ${rightFlagAngle}°)`;
}

export async function solveSemaphore(
  roundId: string,
  bombId: string,
  moduleId: string,
  data: { input: SemaphoreInput }
): Promise<{ output: SemaphoreOutput }> {
  return withErrorWrapping(async () => {
    const response = await api.post(`/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, data);
    return response.data;
  });
}
