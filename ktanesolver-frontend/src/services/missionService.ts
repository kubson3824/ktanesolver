import type { ModuleCatalogItem } from "../types";

const BOMBS_URL = "https://raw.githubusercontent.com/samfundev/KTANE-Bombs/main/importer/bombs.json";

export type MissionPool = {
    count: number;
    modules: string[];
};

export type MissionBomb = {
    modules: number;
    strikes: number;
    time: number;
    widgets: number;
    pools: MissionPool[];
};

export type MissionDefinition = {
    id: string;
    name: string;
    packName: string;
    authors: string[];
    bombs: MissionBomb[];
};

type BombsJsonPack = {
    id: number | string;
    name: string;
    missions?: Array<{
        id: number | string;
        name: string;
        authors?: string[];
        bombs?: MissionBomb[];
    }>;
};

export type ResolvedMissionBomb = {
    modules: Record<string, number>;
    importedCount: number;
    randomCount: number;
    unresolvedCount: number;
};

// Exact game module IDs from the KTaNE module repository. Exact IDs avoid
// accidentally treating similarly named modules as the same puzzle.
const MODULE_TYPES: Record<string, string> = {
    AdjacentLettersModule: "ADJACENT_LETTERS",
    spwizAdventureGame: "ADVENTURE_GAME",
    alphabet: "ALPHABET",
    AnagramsModule: "ANAGRAMS",
    spwizAstrology: "ASTROLOGY",
    BattleshipModule: "BATTLESHIP",
    BigButtonTranslated: "BUTTON",
    BinaryLeds: "BINARY_LEDS",
    BitmapsModule: "BITMAPS",
    BrailleModule: "BRAILLE",
    BlindAlleyModule: "BLIND_ALLEY",
    BrokenButtonsModule: "BROKEN_BUTTONS",
    BigButton: "BUTTON",
    CaesarCipherModule: "CAESAR_CIPHER",
    CheapCheckoutModule: "CHEAP_CHECKOUT",
    ChessModule: "CHESS",
    ChordQualities: "CHORD_QUALITIES",
    ColourFlash: "COLOR_FLASH",
    ColoredSquaresModule: "COLORED_SQUARES",
    combinationLock: "COMBINATION_LOCK",
    complicatedButtonsModule: "COMPLICATED_BUTTONS",
    CoordinatesModule: "COORDINATES",
    Venn: "COMPLICATED_WIRES",
    graphModule: "CONNECTION_CHECK",
    CrazyTalk: "CRAZY_TALK",
    CreationModule: "CREATION",
    CruelPianoKeys: "CRUEL_PIANO_KEYS",
    FestivePianoKeys: "FESTIVE_PIANO_KEYS",
    FlagsModule: "FLAGS",
    CryptModule: "CRYPTOGRAPHY",
    DoubleOhModule: "DOUBLE_OH",
    "Emoji Math": "EMOJI_MATH",
    EnglishTest: "ENGLISH_TEST",
    FollowTheLeaderModule: "FOLLOW_THE_LEADER",
    ForeignExchangeRates: "FOREIGN_EXCHANGE_RATES",
    MemoryV2: "FORGET_ME_NOT",
    FriendshipModule: "FRIENDSHIP",
    TheGamepadModule: "GAMEPAD",
    HexamazeModule: "HEXAMAZE",
    iceCreamModule: "ICE_CREAM",
    Keypad: "KEYPADS",
    NeedyKnob: "KNOBS",
    Laundry: "LAUNDRY",
    LetterKeys: "LETTER_KEYS",
    LightCycleModule: "LIGHT_CYCLE",
    Listening: "LISTENING",
    Logic: "LOGIC",
    fastMath: "FAST_MATH",
    fizzBuzzModule: "FIZZ_BUZZ",
    Maze: "MAZES",
    Memory: "MEMORY",
    Microcontroller: "MICROCONTROLLER",
    ModuleAgainstHumanity: "MODULES_AGAINST_HUMANITY",
    monsplodeFight: "MONSPLODE_FIGHT",
    monsplodeCards: "MONSPLODE_TRADING_CARDS",
    Morse: "MORSE_CODE",
    MorseAMaze: "MORSE_A_MAZE",
    MorseCodeTranslated: "MORSE_CODE",
    MorseV2: "MORSEMATICS",
    MouseInTheMaze: "MOUSE_IN_THE_MAZE",
    murder: "MURDER",
    MysticSquareModule: "MYSTIC_SQUARE",
    NumberPad: "NUMBER_PAD",
    OnlyConnectModule: "ONLY_CONNECT",
    OrientationCube: "ORIENTATION_CUBE",
    Password: "PASSWORDS",
    PasswordsTranslated: "PASSWORDS",
    spwizPerspectivePegs: "PERSPECTIVE_PEGS",
    PianoKeys: "PIANO_KEYS",
    PointOfOrderModule: "POINT_OF_ORDER",
    MazeV2: "PLUMBING",
    Probing: "PROBING",
    resistors: "RESISTORS",
    RockPaperScissorsLizardSpockModule: "ROCK_PAPER_SCISSORS_LIZARD_SPOCK",
    KeypadV2: "ROUND_KEYPAD",
    PasswordV2: "SAFETY_SAFE",
    SeaShells: "SEA_SHELLS",
    Semaphore: "SEMAPHORE",
    shapeshift: "SHAPE_SHIFT",
    SillySlots: "SILLY_SLOTS",
    Simon: "SIMON_SAYS",
    SimonScreamsModule: "SIMON_SCREAMS",
    SimonV2: "SIMON_STATES",
    SkewedSlotsModule: "SKEWED_SLOTS",
    SouvenirModule: "SOUVENIR",
    ButtonV2: "SQUARE_BUTTON",
    switchModule: "SWITCHES",
    symbolicPasswordModule: "SYMBOLIC_PASSWORD",
    TextField: "TEXT_FIELD",
    TheBulbModule: "THE_BULB",
    TheClockModule: "THE_CLOCK",
    ThirdBase: "THIRD_BASE",
    spwiz3DMaze: "THREE_D_MAZE",
    TicTacToeModule: "TIC_TAC_TOE",
    TurnTheKey: "TURN_THE_KEY",
    TurnTheKeyAdvanced: "TURN_THE_KEYS",
    TwoBits: "TWO_BITS",
    WhosOnFirst: "WHOS_ON_FIRST",
    WhosOnFirstTranslated: "WHOS_ON_FIRST",
    YahtzeeModule: "YAHTZEE",
    WirePlacementModule: "WIRE_PLACEMENT",
    WireSequence: "WIRE_SEQUENCES",
    Wires: "WIRES",
    WordScrambleModule: "WORD_SCRAMBLE",
    WordSearchModule: "WORD_SEARCH",
    ZooModule: "ZOO",
};

let missionPromise: Promise<MissionDefinition[]> | undefined;

export function flattenMissions(packs: BombsJsonPack[]): MissionDefinition[] {
    return packs.flatMap((pack) =>
        (pack.missions ?? []).map((mission) => ({
            id: `${pack.id}:${mission.id}`,
            name: mission.name,
            packName: pack.name,
            authors: mission.authors ?? [],
            bombs: mission.bombs ?? [],
        })),
    );
}

export function loadMissions(): Promise<MissionDefinition[]> {
    missionPromise ??= fetch(BOMBS_URL)
        .then((response) => {
            if (!response.ok) throw new Error(`Mission catalog returned ${response.status}`);
            return response.json() as Promise<BombsJsonPack[]>;
        })
        .then(flattenMissions)
        .catch((error) => {
            missionPromise = undefined;
            throw error;
        });
    return missionPromise;
}

export function resolveMissionBomb(
    bomb: MissionBomb,
    catalog: ModuleCatalogItem[],
): ResolvedMissionBomb {
    const supportedIds = new Map(catalog.map((module) => [module.id, module.type]));
    const modules: Record<string, number> = {};
    let importedCount = 0;
    let randomCount = 0;
    let unresolvedCount = 0;

    for (const pool of bomb.pools ?? []) {
        if (pool.modules.length !== 1) {
            randomCount += pool.count;
            continue;
        }

        const sourceId = pool.modules[0];
        const type = MODULE_TYPES[sourceId] ?? supportedIds.get(sourceId);
        if (!type) {
            unresolvedCount += pool.count;
            continue;
        }

        modules[type] = (modules[type] ?? 0) + pool.count;
        importedCount += pool.count;
    }

    return {modules, importedCount, randomCount, unresolvedCount};
}
