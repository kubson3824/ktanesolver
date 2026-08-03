import { api, withErrorWrapping } from "../lib/api";

export type ComplexKeypadSymbol =
  | "ALPHA" | "EPSILON" | "THETA" | "PSI" | "MU" | "XI" | "ZETA"
  | "SIGMA" | "BETA" | "UPPER_DELTA" | "PI" | "OMEGA" | "LOWER_DELTA"
  | "GAMMA" | "ETA" | "ARABIC_MEEM" | "HORSESHOE" | "KAPPA" | "PHI"
  | "HEBREW_NUN" | "ARABIC_NOON";

export interface ComplexKeypadInput {
  symbols: ComplexKeypadSymbol[];
}

export interface ComplexKeypadOutput {
  pressPositions: number[];
  rule: "READING_ORDER" | "CHART_FORWARD" | "CHART_REVERSE";
}

export const solveComplexKeypad = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: ComplexKeypadInput,
): Promise<{ output: ComplexKeypadOutput }> => withErrorWrapping(async () => {
  const response = await api.post<{ output: ComplexKeypadOutput }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
    { input },
  );
  return response.data;
});
