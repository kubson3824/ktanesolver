export enum ModuleType {
  WIRES = "WIRES",
  BUTTON = "BUTTON",
  KEYPADS = "KEYPADS",
  MEMORY = "MEMORY",
  SIMON_SAYS = "SIMON_SAYS",
  MORSE_CODE = "MORSE_CODE",
  FORGET_ME_NOT = "FORGET_ME_NOT",
  WHOS_ON_FIRST = "WHOS_ON_FIRST",
  VENTING_GAS = "VENTING_GAS",
  CAPACITOR_DISCHARGE = "CAPACITOR_DISCHARGE",
  COMPLICATED_WIRES = "COMPLICATED_WIRES",
  WIRE_SEQUENCES = "WIRE_SEQUENCES",
  PASSWORDS = "PASSWORDS",
  MAZES = "MAZES",
}

export enum PortType {
  DVI = "DVI",
  PARALLEL = "PARALLEL",
  PS2 = "PS2",
  RJ45 = "RJ45",
  SERIAL = "SERIAL",
  STEREO_RCA = "STEREO_RCA",
}

export enum BombStatus {
  ACTIVE = "ACTIVE",
  DEFUSED = "DEFUSED",
  EXPLODED = "EXPLODED",
}

export enum RoundStatus {
  SETUP = "SETUP",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export type JsonRecord = Record<string, unknown>;

export interface ModuleEntity {
  id: string;
  type: ModuleType;
  solved: boolean;
  state: JsonRecord;
  solution: JsonRecord;
}

export interface PortPlateEntity {
  id?: string;
  ports: PortType[];
}

export interface BombEntity {
  id: string;
  serialNumber: string;
  aaBatteryCount: number;
  dBatteryCount: number;
  indicators: Record<string, boolean>;
  portPlates: PortPlateEntity[];
  status: BombStatus;
  strikes: number;
  modules: ModuleEntity[];
}

export interface RoundEntity {
  id: string;
  status: RoundStatus;
  startTime?: string;
  version?: number;
  bombs: BombEntity[];
  roundState: JsonRecord;
}

export interface CreateBombRequest {
  serialNumber: string;
  aaBatteryCount: number;
  dBatteryCount: number;
  indicators: Record<string, boolean>;
  portPlates: PortType[][];
}

export interface BombConfig {
  serialNumber?: string;
  aaBatteryCount?: number;
  dBatteryCount?: number;
  indicators?: Record<string, boolean>;
  portPlates?: PortType[][];
}

export interface AddModulesRequest {
  type: ModuleType;
  count: number;
}
