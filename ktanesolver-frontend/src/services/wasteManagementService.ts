import { api, withErrorWrapping } from "../lib/api";

export type WasteTimerBand = "MORE_THAN_HALF" | "HALF_OR_LESS" | "LAST_FIFTH";
export interface WasteManagementInput { timerBand: WasteTimerBand; additionalModuleNames: string[] }
export interface WasteAllocation { material: string; total: number; recycle: number; waste: number; unused: number }
export interface WasteManagementOutput {
  paperAmount: number;
  plasticAmount: number;
  metalAmount: number;
  allocations: WasteAllocation[];
}

export const solveWasteManagement = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: WasteManagementInput,
) => withErrorWrapping(async () => (await api.post<{ output: WasteManagementOutput }>(
  `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
)).data);
