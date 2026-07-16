import { api, withErrorWrapping } from "../lib/api";

export const MICROCONTROLLER_TYPES = ["STRK", "LEDS", "CNTD", "EXPL"] as const;
export type MicrocontrollerType = (typeof MICROCONTROLLER_TYPES)[number];

export const MICROCONTROLLER_PIN_COUNTS = [6, 8, 10] as const;
export type MicrocontrollerPinCount = (typeof MICROCONTROLLER_PIN_COUNTS)[number];

export type MicrocontrollerComponent = "VCC" | "AIN" | "DIN" | "PWM" | "RST" | "GND";
export type MicrocontrollerColor = "BLUE" | "GREEN" | "MAGENTA" | "RED" | "WHITE" | "YELLOW";

export interface MicrocontrollerInput {
  controllerType: MicrocontrollerType;
  pinCount: MicrocontrollerPinCount;
  controllerSerialNumber: string;
}

export interface MicrocontrollerPinSolution {
  pin: number;
  component: MicrocontrollerComponent;
  color: MicrocontrollerColor;
}

export interface MicrocontrollerOutput {
  pins: MicrocontrollerPinSolution[];
  colorRule: string;
}

export const getMicrocontrollerPinRows = (pins: MicrocontrollerPinSolution[]) =>
  pins.slice(0, pins.length / 2).map((pin, index) => [pin, pins.at(-index - 1)!] as const);

export interface MicrocontrollerSolveRequest {
  input: MicrocontrollerInput;
}

export interface MicrocontrollerSolveResponse {
  output: MicrocontrollerOutput;
  solved?: boolean;
}

export const solveMicrocontroller = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: MicrocontrollerSolveRequest,
): Promise<MicrocontrollerSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<MicrocontrollerSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      input,
    );
    return response.data;
  });
};
