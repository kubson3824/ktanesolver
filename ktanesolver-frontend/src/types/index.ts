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
  KNOBS = "KNOBS",
  COLOR_FLASH = "COLOR_FLASH",
  PIANO_KEYS = "PIANO_KEYS",
  SEMAPHORE = "SEMAPHORE",
  MATH = "MATH",
  EMOJI_MATH = "EMOJI_MATH",
  SWITCHES = "SWITCHES",
  TWO_BITS = "TWO_BITS",
  WORD_SCRAMBLE = "WORD_SCRAMBLE",
  ANAGRAMS = "ANAGRAMS",
  COMBINATION_LOCK = "COMBINATION_LOCK",
  LISTENING = "LISTENING",
  FOREIGN_EXCHANGE_RATES = "FOREIGN_EXCHANGE_RATES",
  ROUND_KEYPAD = "ROUND_KEYPAD",
  ORIENTATION_CUBE = "ORIENTATION_CUBE",
  MORSEMATICS = "MORSEMATICS",
  CONNECTION_CHECK = "CONNECTION_CHECK",
  LETTER_KEYS = "LETTER_KEYS",
  LOGIC = "LOGIC",
  ASTROLOGY = "ASTROLOGY",
  MYSTIC_SQUARE = "MYSTIC_SQUARE",
  CRAZY_TALK = "CRAZY_TALK",
  ADVENTURE_GAME = "ADVENTURE_GAME",
  PLUMBING = "PLUMBING",
  CRUEL_PIANO_KEYS = "CRUEL_PIANO_KEYS",
  SAFETY_SAFE = "SAFETY_SAFE",
  CRYPTOGRAPHY = "CRYPTOGRAPHY",
  TURN_THE_KEY = "TURN_THE_KEY",
  TURN_THE_KEYS = "TURN_THE_KEYS",
  CHESS = "CHESS",
  MOUSE_IN_THE_MAZE = "MOUSE_IN_THE_MAZE",
  THREE_D_MAZE = "THREE_D_MAZE",
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

export interface ModuleCatalogItem {
  id: string;
  name: string;
  category: ModuleCategory;
  type: string;  // Changed from ModuleType to string
  tags: string[];
  description: string;
  isSolvable: boolean;
  hasSolver: boolean;  // Indicates if this module has a solver implementation
  checkFirst?: boolean;  // Show in "check these first" strip on Solve page
}

export enum ModuleCategory {
  VANILLA_REGULAR = "VANILLA_REGULAR",
  VANILLA_NEEDY = "VANILLA_NEEDY",
  MODDED_REGULAR = "MODDED_REGULAR",
  MODDED_NEEDY = "MODDED_NEEDY",
}

export interface AddModulesRequest {
  type: ModuleType;
  count: number;
}

export type RoundEventType =
  | "MODULE_SOLVED"
  | "MODULE_STRIKE"
  | "ROUND_STRIKE"
  | "MEMORY_STAGE_COMPLETED"
  | "ROUND_UPDATED";

export interface RoundEventMessage {
  type: RoundEventType;
  timestamp?: string;
  id?: string;
  payload: Record<string, unknown>;
}
