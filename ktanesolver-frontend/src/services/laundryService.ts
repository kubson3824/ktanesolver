import { api, withErrorWrapping } from "../lib/api";

export const LAUNDRY_SYMBOLS = [
  "WASH_80F",
  "WASH_105F",
  "WASH_120F",
  "WASH_95F_DOTS",
  "WASH_GENTLE_OR_DELICATE",
  "HAND_WASH",
  "DO_NOT_WASH",
  "TUMBLE_DRY",
  "LOW_HEAT_DRY",
  "MEDIUM_HEAT",
  "HIGH_HEAT",
  "NO_HEAT",
  "HANG_TO_DRY",
  "DRIP_DRY",
  "DRY_FLAT",
  "DO_NOT_TUMBLE_DRY",
  "DRY",
  "IRON",
  "IRON_110C_230F",
  "IRON_150C_300F",
  "IRON_200C_390F",
  "NO_STEAM",
  "BLEACH",
  "DO_NOT_BLEACH",
  "NON_CHLORINE_BLEACH",
  "ANY_SOLVENT",
  "NO_TETRACHLORETHYLENE",
  "PETROLEUM_SOLVENT_ONLY",
  "WET_CLEANING",
  "DO_NOT_DRYCLEAN",
  "SHORT_CYCLE",
  "REDUCED_MOISTURE",
  "LOW_HEAT",
  "NO_STEAM_FINISHING",
  "CIRCLE_TOP_LEFT",
] as const;

export type LaundrySymbol = (typeof LAUNDRY_SYMBOLS)[number];
export type LaundryItem =
  | "CORSET"
  | "SHIRT"
  | "SKIRT"
  | "SKORT"
  | "SHORTS"
  | "SCARF";
export type LaundryMaterial =
  | "POLYESTER"
  | "COTTON"
  | "WOOL"
  | "NYLON"
  | "CORDUROY"
  | "LEATHER";
export type LaundryColor =
  | "RUBY_FOUNTAIN"
  | "STAR_LEMON_QUARTZ"
  | "SAPPHIRE_SPRINGS"
  | "JADE_CLUSTER"
  | "CLOUDED_PEARL"
  | "MALINITE";

export interface LaundryOutput {
  bobShortcut: boolean;
  washingSymbol: LaundrySymbol | null;
  dryingSymbol: LaundrySymbol | null;
  ironingSymbol: LaundrySymbol | null;
  specialSymbol: LaundrySymbol | null;
  item: LaundryItem;
  material: LaundryMaterial;
  color: LaundryColor;
}

export interface LaundrySolveResponse {
  output: LaundryOutput;
  solved?: boolean;
}

export const solveLaundry = async (
  roundId: string,
  bombId: string,
  moduleId: string,
): Promise<LaundrySolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<LaundrySolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input: {} },
    );
    return response.data;
  });
};
