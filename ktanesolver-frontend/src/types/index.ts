export enum ModuleType {
  WIRES = "WIRES",
  BUTTON = "BUTTON",
  KEYPADS = "KEYPADS",
  MEMORY = "MEMORY",
  SIMON_SAYS = "SIMON_SAYS",
  MORSE_CODE = "MORSE_CODE",
  FORGET_ME_NOT = "FORGET_ME_NOT",
  SOUVENIR = "SOUVENIR",
  WHOS_ON_FIRST = "WHOS_ON_FIRST",
  THIRD_BASE = "THIRD_BASE",
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
  PERSPECTIVE_PEGS = "PERSPECTIVE_PEGS",
  EMOJI_MATH = "EMOJI_MATH",
  SWITCHES = "SWITCHES",
  TWO_BITS = "TWO_BITS",
  WORD_SCRAMBLE = "WORD_SCRAMBLE",
  WORD_SEARCH = "WORD_SEARCH",
  BROKEN_BUTTONS = "BROKEN_BUTTONS",
  ANAGRAMS = "ANAGRAMS",
  COMBINATION_LOCK = "COMBINATION_LOCK",
  LISTENING = "LISTENING",
  FOREIGN_EXCHANGE_RATES = "FOREIGN_EXCHANGE_RATES",
  ROUND_KEYPAD = "ROUND_KEYPAD",
  NUMBER_PAD = "NUMBER_PAD",
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
  CAESAR_CIPHER = "CAESAR_CIPHER",
  TURN_THE_KEY = "TURN_THE_KEY",
  TURN_THE_KEYS = "TURN_THE_KEYS",
  CHESS = "CHESS",
  MOUSE_IN_THE_MAZE = "MOUSE_IN_THE_MAZE",
  HEXAMAZE = "HEXAMAZE",
  BITMAPS = "BITMAPS",
  COLORED_SQUARES = "COLORED_SQUARES",
  ADJACENT_LETTERS = "ADJACENT_LETTERS",
  SILLY_SLOTS = "SILLY_SLOTS",
  THREE_D_MAZE = "THREE_D_MAZE",
  SIMON_STATES = "SIMON_STATES",
  SIMON_SCREAMS = "SIMON_SCREAMS",
  MODULES_AGAINST_HUMANITY = "MODULES_AGAINST_HUMANITY",
  LAUNDRY = "LAUNDRY",
  PROBING = "PROBING",
  ALPHABET = "ALPHABET",
  MICROCONTROLLER = "MICROCONTROLLER",
  MURDER = "MURDER",
  GAMEPAD = "GAMEPAD",
  TIC_TAC_TOE = "TIC_TAC_TOE",
  MONSPLODE_FIGHT = "MONSPLODE_FIGHT",
  SHAPE_SHIFT = "SHAPE_SHIFT",
  FOLLOW_THE_LEADER = "FOLLOW_THE_LEADER",
  FRIENDSHIP = "FRIENDSHIP",
  THE_BULB = "THE_BULB",
  BLIND_ALLEY = "BLIND_ALLEY",
  SEA_SHELLS = "SEA_SHELLS",
  ENGLISH_TEST = "ENGLISH_TEST",
  ROCK_PAPER_SCISSORS_LIZARD_SPOCK = "ROCK_PAPER_SCISSORS_LIZARD_SPOCK",
  SQUARE_BUTTON = "SQUARE_BUTTON",
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
  type: string;
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

export interface BombSummary {
  serialNumber?: string;
  aaBatteryCount: number;
  dBatteryCount: number;
  indicators: Record<string, boolean>;
  ports: PortType[];
  moduleTypes: string[];
}

export interface RoundSummary {
  id: string;
  status: RoundStatus;
  startTime?: string;
  version?: number;
  bombCount: number;
  moduleCount: number;
  bombs: BombSummary[];
}

export interface CreateBombRequest {
  serialNumber: string;
  aaBatteryCount: number;
  dBatteryCount: number;
  indicators: Record<string, boolean>;
  portPlates: PortType[][];
  modules?: Record<string, number>;
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
  type: string;
  tags: string[];
  description: string;
  hasInput: boolean;
  hasOutput: boolean;
  checkFirst?: boolean;
}

export enum ModuleCategory {
  VANILLA_REGULAR = "VANILLA_REGULAR",
  VANILLA_NEEDY = "VANILLA_NEEDY",
  MODDED_REGULAR = "MODDED_REGULAR",
  MODDED_NEEDY = "MODDED_NEEDY",
}

export interface AddModulesRequest {
  type: string;
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
