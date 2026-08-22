import { describe, expect, it } from "vitest";
import { ModuleType } from "../types";
import { generateTwitchCommand, TWITCH_COMMAND_SUPPORT } from "./twitchCommands";

type Fixture = { result: unknown; expected: string };

const fixtures: Record<ModuleType, Fixture> = {
  COOKING: { result: { temperatureC: 200, timeMinutes: 45, ovenSetting: "FAN_WITH_GRILL", lightOn: true }, expected: "!number set temp 200; !number set time 45; !number set setting fwg; !number toggle light; !number cook" },
  LONDON_UNDERGROUND: {
    result: { journey: [{ line: "Hammersmith & City", station: "King's Cross St. Pancras" }, { line: "Victoria", station: "Walthamstow Central" }] },
    expected: "!number top hammersmith King's Cross St. Pancras; !number middle victoria Walthamstow Central; !number submit",
  },
  SINK: { result: { sequence: ["HOT", "COLD", "HOT"] }, expected: "!number hot cold hot" },
  IDENTITY_PARADE: { result: { suspect: "DYLAN", hairColor: "BLONDE", build: "SHORT", attire: "TANK_TOP" }, expected: "!number convict blonde short tank dylan" },
  MAFIA: { result: { godfather: "BRIANE" }, expected: "!number execute briane" },
  JUKEBOX: { result: { pressPositions: [2, 3, 1] }, expected: "!number press 231" },
  WIRES: { result: { wirePosition: 1 }, expected: "!number cut 2" },
  BUTTON: { result: { hold: false }, expected: "!number tap" },
  KEYPADS: { result: { position: "TOP_RIGHT" }, expected: "!number press 2" },
  MEMORY: { result: { position: 3, label: 4 }, expected: "!number position 3" },
  SIMON_SAYS: { result: { presses: ["RED", "BLUE"] }, expected: "!number press red blue" },
  MORSE_CODE: { result: { frequency: 573 }, expected: "!number transmit 573" },
  FORGET_ME_NOT: { result: { sequence: [5, 3, 1] }, expected: "!number press 531" },
  FORGET_EVERYTHING: { result: { solution: "1234567890" }, expected: "!number submit 1234567890" },
  SOUVENIR: { result: { answerIndex: 3 }, expected: "!number answer 3" },
  ICE_CREAM: { result: { flavor: "COOKIES_AND_CREAM" }, expected: "!number sell cookies and cream" },
  THE_SCREW: { result: { hole: 3, buttonLabel: "A" }, expected: "!number unscrew; !number screw 3; !number press A" },
  THE_CUBE: { result: { buttons: [1, 3, 8] }, expected: "!number execute 1 3 8" },
  JEWEL_VAULT: { result: { actions: ["reset", "turn 1 3", "submit"] }, expected: "!number reset; !number turn 1 3; !number submit" },
  YAHTZEE: { result: { action: "ROLL_ALL", keepColors: [] }, expected: "!number roll" },
  X_RAY: { result: { button: 4 }, expected: "!number press 4" },
  BATTLESHIP: { result: { shipLocations: ["A1", "B2"] }, expected: "!number torpedo A1 B2" },
  MINESWEEPER: { result: { startingColor: "RED" }, expected: "!number dig red" },
  VISUAL_IMPAIRMENT: { result: { positions: ["A1", "C3", "E5"] }, expected: "!number press a1 c3 e5" },
  WHOS_ON_FIRST: { result: { buttonText: "YOU ARE" }, expected: "!number YOU ARE" },
  THIRD_BASE: { result: { button: "NHXS" }, expected: "!number NHXS" },
  VENTING_GAS: { result: { answer: "yes" }, expected: "!number yes" },
  CAPACITOR_DISCHARGE: { result: { holdSeconds: 7 }, expected: "!number hold 7" },
  COMPLICATED_WIRES: { result: { wire: 2 }, expected: "!number cut 2" },
  WIRE_SEQUENCES: { result: { wirePosition: 3 }, expected: "!number cut 3" },
  PASSWORDS: { result: { password: "about" }, expected: "!number about" },
  EXTENDED_PASSWORD: { result: { possibleWords: ["anchor"] }, expected: "!number anchor" },
  MAZES: { result: { directions: ["UP", "LEFT", "DOWN"] }, expected: "!number move uld" },
  KNOBS: { result: { position: "RIGHT" }, expected: "!number rotate 1" },
  COLOR_FLASH: { result: { pressYes: true, position: 3 }, expected: "!number press yes 3" },
  COLOR_DECODING: { result: { selections: [{ type: "ROW", index: 2 }, { type: "COLUMN", index: 5 }] }, expected: "!number row2 col5" },
  PIANO_KEYS: { result: { notes: ["C_SHARP", "A"] }, expected: "!number press Db A" },
  SEMAPHORE: { result: { currentIndex: 0, targetIndex: 2 }, expected: "!number move right; !number move right; !number press ok" },
  PERSPECTIVE_PEGS: { result: { pressPositions: ["Lower left", "Top"] }, expected: "!number press bl t" },
  EMOJI_MATH: { result: { answer: -47 }, expected: "!number submit -47" },
  SWITCHES: { result: { solutionSteps: [1, 5, 3] }, expected: "!number flip 1 5 3" },
  COLORED_SWITCHES: { result: { solutionSteps: [5, 2, 4] }, expected: "!number toggle 5 2 4" },
  TWO_BITS: { result: { letters: "kt", stages: [{}] }, expected: "!number press k t query" },
  WORD_SCRAMBLE: { result: { solution: "stream" }, expected: "!number submit stream" },
  FONT_SELECT: { result: { actions: ["right", "submit"] }, expected: "!number right; !number submit" },
  WORD_SEARCH: { result: { start: "B3", end: "E6" }, expected: "!number select B3 E6" },
  BROKEN_BUTTONS: { result: { action: "PRESS", column: 2, row: 1 }, expected: "!number press 2 1" },
  COMPLICATED_BUTTONS: { result: { pressOrder: [2, 4, 1] }, expected: "!number press 2 4 1" },
  ANAGRAMS: { result: { possibleSolutions: ["poodle"] }, expected: "!number submit poodle" },
  COMBINATION_LOCK: { result: { firstNumber: 1, secondNumber: 2, thirdNumber: 3 }, expected: "!number submit 1 2 3" },
  LISTENING: { result: { code: "$ & * * #" }, expected: "!number press $ & * * #" },
  FOREIGN_EXCHANGE_RATES: { result: { keyPosition: 0 }, expected: "!number press 1" },
  ROUND_KEYPAD: { result: { positions: [8, 2, 5] }, expected: "!number press 8 2 5" },
  COMPLEX_KEYPAD: { result: { pressPositions: [2, 3, 1, 4, 5, 6, 7, 8, 9] }, expected: "!number press 2 3 1 4 5 6 7 8 9" },
  NUMBER_PAD: { result: { code: "4236" }, expected: "!number submit 4236" },
  ORIENTATION_CUBE: { result: { rotations: ["ROTATE_CLOCKWISE", "ROTATE_LEFT"] }, expected: "!number press cw l set" },
  MORSEMATICS: { result: { letter: "F" }, expected: "!number submit ..-." },
  CONNECTION_CHECK: { result: { led1: true, led2: false, led3: true, led4: false }, expected: "!number submit green red green red" },
  LETTER_KEYS: { result: { letter: "B" }, expected: "!number press B" },
  LOGIC: { result: { answers: [false, true] }, expected: "!number submit false true" },
  SUPERLOGIC: { result: { values: [true, false, true] }, expected: "!number submit t f t" },
  LOGIC_GATES: { result: { readyToCheck: true }, expected: "!number check" },
  ASTROLOGY: { result: { omenScore: -2 }, expected: "!number press bad on 2" },
  MYSTIC_SQUARE: { result: { targetConstellation: [1, null, 3] }, expected: "!number press 1 3" },
  CRAZY_TALK: { result: { downAt: 4, upAt: 5 }, expected: "!number toggle 4 5" },
  ADVENTURE_GAME: { result: { itemsToUse: ["POTION"], weaponToUse: "CABER" }, expected: "!number use potion, caber" },
  PLUMBING: { result: { rotations: ["A3", "B4"], submit: true }, expected: "!number rotate A3 B4; !number submit" },
  CRUEL_PIANO_KEYS: { result: { notes: ["A_SHARP", "C"] }, expected: "!number press Bb C" },
  FESTIVE_PIANO_KEYS: { result: { notes: ["D_SHARP", "F", "G_SHARP"] }, expected: "!number press Eb F Ab" },
  BUTTON_SEQUENCE: { result: { actions: ["PRESS", "SKIP", "PRESS"] }, expected: "!number tap 1 3 down" },
  FLAGS: { result: { answerCountry: "NEW_ZEALAND" }, expected: "!number submit new zealand" },
  TIMEZONE: { result: { submission: "0355" }, expected: "!number submit 0355" },
  POLYHEDRAL_MAZE: { result: { firstClockHour: 10, relativeDirections: [2, 2, 1, 1] }, expected: "!number move 10 2 2 1 1" },
  SYMBOLIC_COORDINATES: { result: { coordinate: "Z9" }, expected: "!number submit Z9" },
  POETRY: { result: { correctWords: ["clarity", "energy"] }, expected: "!number press clarity" },
  SONIC_THE_HEDGEHOG: { result: { button: "RBt" }, expected: "!number press RBt" },
  ALGEBRA: { result: { stage: 2, equation: "b=(z-y)/2", answer: "-1.25" }, expected: "!number submit -1.25" },
  SAFETY_SAFE: { result: { dialTurns: [1, 2, 3, 4, 5, 6] }, expected: "!number submit 1 2 3 4 5 6" },
  CRYPTOGRAPHY: { result: { keyOrder: ["N", "B", "V"] }, expected: "!number press N B V" },
  CAESAR_CIPHER: { result: { solution: "KBQ" }, expected: "!number press K B Q" },
  MODERN_CIPHER: { result: { solution: "PRINTER" }, expected: "!number submit printer" },
  PLAYFAIR_CIPHER: { result: { pressSequence: "BDAC" }, expected: "!number press b d a c" },
  TURN_THE_KEY: { result: { turnWhenSeconds: 509 }, expected: "!number turn 8:29" },
  TURN_THE_KEYS: { result: { canTurnRightKey: true, rightKeyTurned: false }, expected: "!number turn right" },
  CHESS: { result: { coordinate: "C2" }, expected: "!number press C2" },
  MOUSE_IN_THE_MAZE: { result: { moves: ["FORWARD", "TURN_LEFT"] }, expected: "!number f l; !number submit" },
  MORSE_A_MAZE: { result: { moves: ["UP", "RIGHT", "DOWN"] }, expected: "!number move URD" },
  HEXAMAZE: { result: { moves: ["NORTHWEST", "EAST"] }, expected: "!number northwest east" },
  BLIND_MAZE: { result: { moves: ["NORTH", "EAST", "SOUTH", "WEST"] }, expected: "!number move nesw" },
  BITMAPS: { result: { button: 2 }, expected: "!number press 2" },
  BRAILLE: { result: { pressPosition: 3 }, expected: "!number press 3" },
  COLORED_SQUARES: { result: { coordinates: ["A1", "A2", "B3"] }, expected: "!number A1 A2 B3" },
  ADJACENT_LETTERS: { result: { pressLetters: ["D", "P", "C"] }, expected: "!number submit D P C" },
  SILLY_SLOTS: { result: { legal: false }, expected: "!number pull" },
  SKEWED_SLOTS: { result: { code: "1 2 3" }, expected: "!number submit 1 2 3" },
  THREE_D_MAZE: { result: { moves: ["FORWARD", "TURN_LEFT"] }, expected: "!number move F L" },
  SIMON_STATES: { result: { press: "RED" }, expected: "!number press red" },
  SIMON_SCREAMS: { result: { press: ["RED", "BLUE"] }, expected: "!number press red blue" },
  SIMON_SINGS: { result: { press: ["left A♯", "right D♯", "left G♯", "right D"] }, expected: "!number play left A# right D# left G# right D" },
  SIMON_SENDS: { result: { transmission: "WKWBWKCBBKB" }, expected: "!number press wkwbwkcbbkb" },
  SIMON_SHRIEKS: { result: { presses: ["WHITE", "BLUE", "CYAN", "RED"] }, expected: "!number press white blue cyan red" },
  MODULES_AGAINST_HUMANITY: { result: { commands: ["press reset", "press submit"] }, expected: "!number press reset; !number press submit" },
  LAUNDRY: { result: { bobShortcut: false, washingSymbol: "WASH_80F", dryingSymbol: "TUMBLE_DRY", ironingSymbol: "IRON", specialSymbol: "BLEACH" }, expected: "!number set all 4 0 0 0; !number insert coin" },
  PROBING: { result: { redClipWire: 4, blueClipWire: 3 }, expected: "!number connect 4 3" },
  ALPHABET: { result: { pressOrder: ["A", "B", "C"] }, expected: "!number press A B C" },
  MICROCONTROLLER: { result: { pins: [{ color: "RED" }, { color: "WHITE" }] }, expected: "!number set red; !number set white" },
  MURDER: { result: { suspect: "MISS_SCARLETT", weapon: "CANDLESTICK", location: "KITCHEN" }, expected: "!number it was miss scarlett, with the candlestick, in the kitchen" },
  SUBWAYS: { result: { route: 8, time: "7 PM", stops: ["Bowling Green 4-5", "Wall St 4-5", "City Hall 4-5-6"] }, expected: "!number submit 7 pm, Bowling Green 4-5, Wall St 4-5, City Hall 4-5-6" },
  DR_DOCTOR: { result: { diagnosis: "Jaundry", treatment: "λ-3", dose: "42mg", followUpDay: 12, followUpMonth: 4 }, expected: "!number treat Jaundry,λ-3,42mg,12,4" },
  TAX_RETURNS: { result: { totalTaxBill: 75336 }, expected: "!number submit 75336" },
  RESISTORS: { result: { requiredConnections: [{ inputPin: "A", outputPin: "C", path: "DIRECT" }] }, expected: "!number connect a c; !number submit" },
  GAMEPAD: { result: { sequence: ["A", "B", "◀", "R"] }, expected: "!number submit ab◀r" },
  TIC_TAC_TOE: { result: { action: "PRESS", number: 5 }, expected: "!number 5" },
  MONSPLODE_FIGHT: { result: { move: "SPLASH" }, expected: "!number use splash" },
  MONSPLODE_TRADING_CARDS: { result: { action: "TRADE", selectedCard: 1, tradeCard: 3 }, expected: "!number right; !number right; !number trade" },
  GAME_OF_LIFE_SIMPLE: { result: { whiteCells: Array.from({ length: 48 }, (_, index) => index === 0 || index === 7), submitInitial: false }, expected: "!number clear A1 B2 submit" },
  GAME_OF_LIFE_CRUEL: { result: { whiteCells: Array.from({ length: 48 }, (_, index) => index === 2), submitInitial: false }, expected: "!number clear C1 submit" },
  SHAPE_SHIFT: { result: { left: "POINT", right: "ROUND" }, expected: "!number submit point round" },
  FOLLOW_THE_LEADER: { result: { cutPlugs: [4, 6, 2] }, expected: "!number cut 4 6 2" },
  FRIENDSHIP: { result: { element: "Fairness" }, expected: "!number submit Fairness" },
  THE_BULB: { result: { actions: ["Press O.", "Unscrew the bulb."], continueFrom: 0 }, expected: "!number O, unscrew" },
  BLIND_ALLEY: { result: { regions: ["TL", "TM"] }, expected: "!number TL TM" },
  SEA_SHELLS: { result: { pressOrder: ["ALAR", "LLAMA"] }, expected: "!number label ALAR LLAMA" },
  ENGLISH_TEST: { result: { answerPosition: 2 }, expected: "!number submit 2" },
  ROCK_PAPER_SCISSORS_LIZARD_SPOCK: { result: { signsToPress: ["ROCK", "SPOCK"] }, expected: "!number press rock spock" },
  SQUARE_BUTTON: { result: { hold: false, instruction: "Press and immediately release" }, expected: "!number tap" },
  TEXT_FIELD: { result: { positions: [{ column: 2, row: 3 }, { column: 4, row: 1 }] }, expected: "!number press 2,3 4,1" },
  SYMBOLIC_PASSWORD: { result: { moves: ["LEFT_COLUMN", "TOP_RIGHT"] }, expected: "!number cycle l tr; !number submit" },
  WIRE_PLACEMENT: { result: { cutWires: [{ coordinate: "A2" }, { coordinate: "C4" }] }, expected: "!number cut A2 C4" },
  PERPLEXING_WIRES: { result: { cutFirst: [2], cutNormal: [5, 6], cutLast: [1] }, expected: "!number cut 2 5 6 1" },
  DOUBLE_OH: { result: { presses: ["SINGLE_VERTICAL", "SQUARE"] }, expected: "!number vert1 submit" },
  CHEAP_CHECKOUT: { result: { needsSecondPayment: false, change: 3.24 }, expected: "!number submit 3.24" },
  COORDINATES: { result: { matchingClues: ["2 4", "8 1"] }, expected: "!number submit 2 4; !number submit 8 1" },
  LIGHT_CYCLE: { result: { sequence: ["BLUE", "RED", "WHITE"] }, expected: "!number B R W" },
  SYMBOL_CYCLE: { result: { mode: "RETROTRANSPHASIC", leftClicks: 3, rightClicks: 2 }, expected: "!number click left 3; !number click right 2; !number flip" },
  BINARY_LEDS: { result: { recommendedColor: "RED", recommendedValue: 25 }, expected: "!number cut red 25" },
  RHYTHMS: { result: { mash: false, actions: [{ button: "BLUE", beeps: 3 }] }, expected: "!number press blue 3" },
  COLOR_MATH: { result: { colors: ["RED", "GREEN", "BLUE", "PURPLE"] }, expected: "!number set r,g,b,p; !number submit" },
  COLOR_MORSE: { result: { morse: ["-....-", "....-", "--..."] }, expected: "!number transmit -....- ....- --..." },
  COLOR_GENERATOR: { result: { red: 18, green: 19, blue: 66 }, expected: "!number submit 18 19 66" },
  BIG_CIRCLE: { result: { pressSequence: ["ORANGE", "WHITE", "MAGENTA"] }, expected: "!number press orange white magenta" },
  MASTERMIND_SIMPLE: { result: { nextGuess: ["RED", "BLUE", "GREEN", "YELLOW", "MAGENTA"], submit: false }, expected: "!number query r b g y m" },
  MASTERMIND_CRUEL: { result: { nextGuess: ["RED", "BLUE", "GREEN", "YELLOW", "MAGENTA"], submit: true }, expected: "!number submit r b g y m" },
  GRIDLOCK: { result: { coordinate: "C4" }, expected: "!number press C4" },
  ONLY_CONNECT: { result: { position: 4, groups: [] }, expected: "!number press 4" },
  NEUTRALIZATION: { result: { baseFormula: "NaOH", drops: 6, filterOn: true }, expected: "!number base NaOH; !number conc set 6; !number filter; !number titrate" },
  WEB_DESIGN: { result: { answer: "CONSIDER" }, expected: "!number con" },
  CHORD_QUALITIES: { result: { answerNotes: ["A", "C♯", "E"] }, expected: "!number submit A C# E" },
  CREATION: { result: { first: "WATER", second: "FIRE" }, expected: "!number combine water fire" },
  RUBIKS_CUBE: { result: { moves: ["R", "U", "R'"] }, expected: "!number R U R'" },
  RUBIKS_CLOCK: { result: { pins: ["TR", "BL"], gear: "BR", hours: -3 }, expected: "!number tr bl br -3 t" },
  FIZZ_BUZZ: { result: { actions: ["FIZZ", "NUMBER", "FIZZBUZZ"] }, expected: "!number submit fizz number fizzbuzz" },
  THE_CLOCK: { result: { targetTime: "12:34 PM" }, expected: "!number set 12:34 pm" },
  THE_STOPWATCH: { result: { runtimeSeconds: 22 }, expected: "!number stop at 22" },
  PIE: { result: { pressOrder: [2, 4, 5, 3, 1] }, expected: "!number press 2 4 5 3 1" },
  THE_WIRE: { result: { dial1: "Q", dial2: "E", dial3: "Y", cutSecond: 3 }, expected: "!number set 1 Q 2 E 3 Y; !number cut at 3" },
  LED_ENCRYPTION: { result: { correctLetters: ["B"] }, expected: "!number press B" },
  LED_GRID: { result: { pressOrder: ["C", "D", "A", "B"] }, expected: "!number press cdab" },
  GRAFFITI_NUMBERS: { result: { pressNumbers: [6, 7, 9, 1], buttonPositions: [6, 5, 2, 1] }, expected: "!number spray 6 5 2 1" },
  X01: { result: { darts: ["SB", "IN6", "T13", "D16"] }, expected: "!number throw SB IN6 T13 D16" },
  LOGICAL_BUTTONS: { result: { pressButtons: [2, 3, 1], pressOperator: false }, expected: "!number press 2 3 1" },
  THE_SUN: { result: { pressSequence: ["inner southeast", "outer south", "center"] }, expected: "!number press inner southeast;outer south;center" },
  THE_MOON: { result: { pressSequence: ["outer southwest", "outer northwest", "center"] }, expected: "!number press outer southwest;outer northwest;center" },
  GRID_MATCHING: { result: { letter: "D", actions: ["up", "right", "clockwise"] }, expected: "!number up right clockwise set d submit" },
  LASERS: { result: { positions: [8, 4, 7, 5, 3, 2, 9] }, expected: "!number position 8475329" },
  TURTLE_ROBOT: { result: { shape: "Mushroom", bugLines: [6, 11, 18] }, expected: "!number down 5; !number comment; !number down 5; !number comment; !number down 7; !number comment" },
  GUITAR_CHORDS: { result: { stage: 1, chord: "Ab", capoPosition: 3, frets: ["3", "3", "4", "5", "5", "3"] }, expected: "!number play 3,3,4,5,5,3" },
  CALENDAR: { result: { targetMonth: 3, targetDay: 17, pressCount: 1 }, expected: "!number mar; !number press 17" },
  USA_MAZE: { result: { route: ["CA", "AZ", "NM", "TX"], presses: ["Circle", "Square", "Heart"] }, expected: "!number press 016" },
  BINARY_TREE: { result: { presses: [1, 2, 3, 4, 5, 6, 7] }, expected: "!number press 1; !number press 2; !number press 3; !number press 4; !number press 5; !number press 6; !number press 7" },
  THE_TIME_KEEPER: { result: { correctLed: 3, finalNumber: 59999 }, expected: "!number press 3 at 999:59" },
  LIGHTSPEED: { result: { warpSpeed: 8, planet: "Gaia IV", officer: "Kim, H", encryptionCode: "3451" }, expected: "!number set warp 8; !number set planet gaia iv; !number set officer kim; !number set encryption 3451; !number engage" },
  BLACK_HOLE: { result: { digit: 2 }, expected: "!number tap tick hold tick release" },
  SIMONS_STAR: { result: { presses: ["Red", "Green", "Blue", "Yellow", "Purple"] }, expected: "!number press red green blue yellow purple" },
  MORSE_WAR: { result: { presses: ["S", "U", "S", "U"] }, expected: "!number press SUSU" },
  THE_STOCK_MARKET: { result: { companies: ["ADM"] }, expected: "!number submit A" },
  MINESEEKER: { result: { destinationImage: "11", moves: ["R", "R", "R", "D"] }, expected: "!number rrrd submit" },
  MAZE_SCRAMBLER: { result: { presses: ["RED", "BLUE", "GREEN", "YELLOW"] }, expected: "!number reset; !number press rbgy" },
  THE_NUMBER_CIPHER: { result: { answer: 0, rule: "C" }, expected: "!number submit 0" },
  ALPHABET_NUMBERS: { result: { stage: 1, presses: [1, 2, 6, 5, 4, 3] }, expected: "!number press 1 2 6 5 4 3" },
  BRITISH_SLANG: { result: { stage: 2, pressPosition: 4, pressLabel: "Bagsy" }, expected: "!number press 4" },
  DOUBLE_COLOR: { result: { stage: 1, digit: 0 }, expected: "!number submit at 0" },
  MARITIME_FLAGS: { result: { finalBearing: 101, direction: "E" }, expected: "!number E" },
  EQUATIONS: { result: { answer: "-0.166", blank: false }, expected: "!number submit -0.166" },
  DETERMINANTS: { result: { determinant: -162 }, expected: "!number submit -162" },
  PATTERN_CUBE: { result: { placements: [
    { selection: 1, targetLetter: "E", rotation: "cw" }, { selection: 2, targetLetter: "D", rotation: "none" },
    { selection: 3, targetLetter: "G", rotation: "cw" }, { selection: 4, targetLetter: "F", rotation: "cw" },
    { selection: 5, targetLetter: "H", rotation: "ccw" },
  ] }, expected: "!number 1 cw 1 E 2 D 3 cw 3 G 4 cw 4 F 5 ccw 5 H" },
  KNOW_YOUR_WAY: { result: { presses: ["D", "R", "R", "U"] }, expected: "!number press DRRU" },
  SPLITTING_THE_LOOT: { result: { colors: ["RED", "BLUE", "RED", "NORMAL", "BLUE", "NORMAL", "RED"], coloredBag: 1 }, expected: "!number set bag 3 7 red; !number set bag 2 5 blue; !number set bag 4 6 normal; !number split" },
  CHARACTER_SHIFT: { result: { solutions: [{ letter: "X", digit: 0, shiftedLetter: "A" }] }, expected: "!number submit X0" },
  SIMON_SAMPLES: { result: { presses: [1, 1, 2, 4] }, expected: "!number record; !number 1 1 2 4" },
  DRAGON_ENERGY: { result: { acceptableWords: ["Energy"], safeTimerDigits: [2, 3, 4] }, expected: "!number energy 2" },
  UNCOLORED_SQUARES: { result: { placements: [["A1", "B1", "A2"]] }, expected: "" },
  FLASHING_LIGHTS: { result: { presses: [3, 4] }, expected: "!number press 3; !number press 4" },
  THREE_D_TUNNELS: { result: { actions: ["U", "R", "D", "SUBMIT"] }, expected: "!number move u r d; !number submit" },
  SYNCHRONIZATION: { result: { steps: [{ firstPosition: 1, firstState: "ON", secondPosition: 5, secondState: "ON" }, { firstPosition: 2, firstState: "OFF", secondPosition: 4, secondState: "OFF" }, { firstPosition: 3, firstState: "ON", secondPosition: 1, secondState: "ON" }, { firstPosition: 2, firstState: "OFF", secondPosition: 1, secondState: "OFF" }], timerDigit: 8 }, expected: "!number 1 on 5 on; !number 2 off 4 off; !number 3 on 1 on; !number 2 off 1 off; !number 8" },
  THE_SWITCH: { result: { timerDigit: 5 }, expected: "!number flip 5" },
  REVERSE_MORSE: { result: { firstTransmission: [".-", "br", "-...", "br", "-.-.", "br", "-..", "br", ".", "br", "..-.", "br", "tx"], secondTransmission: ["--.", "br", "....", "br", "..", "br", ".---", "br", "-.-", "br", ".-..", "br", "tx"], currentStage: 1 }, expected: "!number .- br -... br -.-. br -.. br . br ..-. br tx --. br .... br .. br .--- br -.- br .-.. br tx" },
  MANOMETERS: { result: { stage: 2, topPressure: 6, bottomLeftPressure: 8, bottomRightPressure: 7, useValve: true }, expected: "!number t 6 bl 8 br 7; !number valve" },
  SHIKAKU: { result: { presses: Array.from({ length: 36 }, (_, index) => `${String.fromCharCode(65 + index % 6)}${Math.floor(index / 6) + 1}`) }, expected: `!number press ${Array.from({ length: 36 }, (_, index) => `${String.fromCharCode(97 + index % 6)}${Math.floor(index / 6) + 1}`).join(" ")}` },
  WIRE_SPAGHETTI: { result: { aliases: ["p", "dr", "lg", "p"] }, expected: "!number cut p dr lg p" },
  MODULE_HOMEWORK: { result: { button: 3 }, expected: "!number start; !number press 3" },
  TENNIS: { result: { actions: ["LR", "S11", "S12", "R", "S", "S"] }, expected: "!number lr s11 s12 r s s" },
  BENEDICT_CUMBERBATCH: { result: { leftSuffix: "bee", rightSuffix: "d'captain" }, expected: "!number submit bee d'captain" },
  BOGGLE: { result: { plays: [{ cells: ["A1", "B2", "C3"] }, { cells: ["D4", "C4", "B3"] }] }, expected: "!number press a1 b2 c3; !number press d4 c4 b3" },
  HORRIBLE_MEMORY: { result: { position: 6, label: 2, color: "orange" }, expected: "!number position 6" },
  SIGNALS: { result: { clicks: ["s2", "s2", "s2", "s3", "s3", "s3"] }, expected: "!number s2 s2 s2 s3 s3 s3; !number submit" },
  BOOLEAN_MAZE: { result: { action: "STUCK", from: [0, 0], to: [0, 0] }, expected: "!number press stuck" },
  SONIC_KNUCKLES: { result: { object: "hero", ringSecond: 5, hitsRequired: 3, firstHitParity: "even", finalHitParity: "odd" }, expected: "!number press hero at 05; !number even 2; !number odd 1" },
  QUINTUPLES: { result: { answer: "08341" }, expected: "!number submit 08341" },
  THE_SPHERE: { result: { actions: [{type:"tap",value:4},{type:"hold",value:7}] }, expected: "!number tap 4; hold 7" },
  COFFEEBUCKS: { result: { customerName:"Alex",selectedDrink:"Twix Frappuccino",quirkCommand:"gluten" }, expected: "!number name Alex 0; !number gluten; !number submit Twix Frappuccino" },
  COLORFUL_MADNESS: { result: { presses:[1,4,8,12,16,20] }, expected: "!number press 1 4 8 12 16 20" },
  BASES: { result: { answer:"482" }, expected: "!number 482" },
  LIONS_SHARE: { result: { portions:[{lion:"Simba",percentage:60},{lion:"Nala",percentage:40}] }, expected: "!number set Simba 60, set Nala 40, submit" },
  SNOOKER: { result: { actions:["red","black","cue","red","pink","cue"] }, expected: "!number red black cue red pink cue" },
  BLACKJACK: { result: { actions:["hit","hit","stand"] }, expected: "!number hit; !number hit; !number stand" },
  PARTY_TIME: { result: { actions:["die 1 12 13","space 6 17","roll start"] }, expected: "!number die 1 12 13; !number space 6 17; !number roll start" },
  ACCUMULATION: { result: { currentAnswer:447 }, expected: "!number submit 447" },
  THE_PLUNGER_BUTTON: { result: { pressDigit:5,releaseDigit:3 }, expected: "!number hold on 5, release on 3" },
  THE_DIGIT: { result: { answer:6 }, expected: "!number submit 6" },
  THE_JACK_O_LANTERN: { result: { press:"trick" }, expected: "!number trick" },
  T_WORDS: { result: { positions:[2,4,1,3] }, expected: "!number press 2413" },
  FESTIVE_JUKEBOX: { result: { positions:[2,3,1] }, expected: "!number press 231" },
  DIVIDED_SQUARES: { result: { action:"submit",square:"B3" }, expected: "!number submit b3" },
  CONNECTION_DEVICE: { result: { commands:["boot","open discord","set 5CARDE","send 07"] }, expected: "!number boot; !number open discord; !number set 5CARDE; !number send 07" },
  INSTRUCTIONS: { result: { position:3 }, expected: "!number press 3" },
  VALVES: { result: { twitchToggles:[1,3] }, expected: "!number toggle 1 3" },
  BLOCKBUSTERS: { result: { coordinate:"B5" }, expected: "!number B5" },
  CATCHPHRASE: { result: { presses:[{position:1,timerDigit:7},{position:2,timerDigit:6},{position:4,timerDigit:9},{position:3,timerDigit:1}],product:720 }, expected: "!number panel 1 at 7; !number panel 2 at 6; !number panel 4 at 9; !number panel 3 at 1; !number submit 720" },
  COUNTDOWN: { result: { operations:[{left:25,operator:"*",right:4,result:100},{left:100,operator:"+",right:75,result:175}] }, expected: "!number activate; !number 25 * 4; !number 100 + 75" },
  CRUEL_COUNTDOWN: { result: { operations:[{left:90,operator:"+",right:70,result:160}] }, expected: "!number activate; !number 90 + 70" },
  ENCRYPTED_MORSE: { result: { responseMorse:".--..-.....-...-.---" }, expected: "!number submit .--..-.....-...-.---" },
  THE_CRYSTAL_MAZE: { result: {}, expected: "" },
  IKEA: { result: { presses:[4,4,2,2,4,2,2,3,3,3,2,3] }, expected: "!number press 4 4 2 2 4 2 2 3 3 3 2 3" },
  RETIREMENT: { result: { home:"Hotham Place" }, expected: "!number Hotham Place" },
  ONE_HUNDRED_AND_ONE_DALMATIANS: { result: { name:"Roly Poly" }, expected: "!number Roly Poly" },
  PERIODIC_TABLE: { result: { atomicNumber:69 }, expected: "!number submit 69" },
  SCHLAG_DEN_BOMB: { result: { contestantGames:[2,5,9],unplayedGames:[13,14,15] }, expected: "!number b 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; !number c 2 5 9; !number u 13 14 15; !number submit" },
  MAHJONG: { result: { pair:["Bamboo 2","Char 5"] }, expected: "!number Bamboo 2,Char 5" },
  KUDOSUDOKU: { result: { submission:"Kick" }, expected: "!number Kick" },
  THE_RADIO: { result: { commands:["reset","channel down 16","switch","transmit at 07"] }, expected: "!number reset; !number channel down 16; !number switch; !number transmit at 07" },
  MODULO: { result: { answer:9 }, expected: "!number submit 9" },
  NUMBER_NIMBLENESS: { result: { press:4 }, expected: "!number press 4" },
  PAY_RESPECTS: { result: { action:"PRESS_F" }, expected: "!number f" },
  CHALLENGE_AND_CONTACT: { result: { answer:"KEYPAD" }, expected: "!number submit keypad" },
  THE_LABYRINTH: { result: { steps:[{directions:["UP","LEFT"]},{directions:["RIGHT","DOWN"]}] }, expected: "!number move ulrd" },
  SPINNING_BUTTONS: { result: { pressOrder:[{color:"PURPLE"},{color:"ORANGE"},{color:"RED"},{color:"BLUE"}] }, expected: "!number press purple orange red blue" },
  THE_TRIANGLE: { result: { position:"BL", color:"RED" }, expected: "!number press bl" },
  SUEET_WALL: { result: { pressCoordinates:["A1","D5"] }, expected: "!number press A1 D5" },
  HOT_POTATO: { result: { action:"DROP_BOMB" }, expected: "!bomb drop" },
  CHRISTMAS_PRESENTS: { result: { hour:19 }, expected: "!number 19" },
  LED_MATH: { result: { answer:-175 }, expected: "!number submit -175" },
  PIGPEN_ROTATIONS: { result: { answer:"ABCDEFGHIJKL" }, expected: "!number ABCDEFGHIJKL" },
  SIMON_SOUNDS: { result: { presses:["RED","BLUE","GREEN"] }, expected: "!number input R B G" },
  HARMONY_SEQUENCE: { result: { pressPositions:[2,4,3,1] }, expected: "!number sound 2431" },
  SIMON_SCRAMBLES: { result: { presses:["YELLOW","BLUE","YELLOW","BLUE","RED","YELLOW","BLUE","RED","RED","RED"] }, expected: "!number YBYBRYBRRR" },
  UNFAIR_CIPHER: { result: { actions:[{button:"RED",timerSeconds:[]},{button:"INNER",timerSeconds:["00","10","20","30","40","50"]},{button:"INNER",timerSeconds:[]},{button:"BLUE",timerSeconds:[]}] }, expected: "!number red; !number inner 00 10 20 30 40 50; !number inner; !number blue" },
  MELODY_SEQUENCER: { result: { moves:[{fromSlot:3,toSlot:1}],recordings:[{slot:2,notes:["D4","F4","A4","C5","D5","A4","D5","C5"]}] }, expected: "!number slot 3; !number move to 1; !number slot 2; !number record D4 F4 A4 C5 D5 A4 D5 C5" },
  COLORFUL_INSANITY: { result: { pressCoordinates:["A1","E1","G5"] }, expected: "!number press A1 E1 G5" },
  GADGETRON_VENDOR: { result: { answer:1300 }, expected: "" },
  LEFT_AND_RIGHT: { result: { pressSequence:["RIGHT","RIGHT","LEFT","RIGHT"] }, expected: "!number RRLR" },
  PASSPORT_CONTROL: { result: { decision:"APPROVE" }, expected: "!number accept" },
  THE_HEXABUTTON: { result: { action:"RELEASE",suggestedTime:"9:00" }, expected: "!number release 9:00" },
  GENETIC_SEQUENCE: { result: { pressPositions:[4,3,3,4,4,4,1,1,2,2,2,1] }, expected: "!number 433444112221O" },
  MICRO_MODULES: { result: { twitchCommands:["send 9 6 4 0","press 1","answer 1 4 2","cut 1","submit"] }, expected: "!number send 9 6 4 0; !number press 1; !number answer 1 4 2; !number cut 1; !number submit" },
  ELDER_FUTHARK: { result: { pressSequence:["Ansuz","Sowulo","Algiz"] }, expected: "!number activate; !number submit Ansuz, Sowulo, Algiz" },
  MODULE_MAZE: { result: { route:"URRDL" }, expected: "!number toggle; !number URRDL; !number toggle" },
  TASHA_SQUEALS: { result: { pressColors:["PINK","BLUE","PINK","GREEN","YELLOW"] }, expected: "!number press pink; !number press pink blue; !number press pink blue pink; !number press pink blue pink green; !number press pink blue pink green yellow" },
  FORGET_THIS: { result: { answer:"F" }, expected: "!number submit F" },
  DIGITAL_CIPHER: { result: { pressSequence:"GHGHGHGHGHGHGHG" }, expected: "!number press GHGHGHGHGHGHGHG" },
  BURGER_ALARM: { result: { pressSequence:["BUN","MAYO","MAYO","CHEESE","MAYO","BUN","BUN"] }, expected: "!number order; !number press bun mayo mayo cheese mayo bun bun; !number submit" },
  GROCERY_STORE: { result: { action:"ADD" }, expected: "!number add" },
  SUBSCRIBE_TO_PEWDIEPIE: { result: { submission:"01234" }, expected: "!number submit 01234" },
  CRYPTIC_PASSWORD: { result: { answer:"RDOTVU" }, expected: "!number submit RDOTVU" },
  LOMBAX_CUBES: { result: { timerDigit: 7 }, expected: "" },
  MEGA_MAN_2: { result: { password:["A1","B2","C3","D4","E5","A5","B4","C2","D1"] }, expected: "!number press A1 B2 C3 D4 E5 A5 B4 C2 D1" },
  PURGATORY: { result: { destination:"HEAVEN",timing:"ON_TWO",clickCount:1 }, expected: "!number press heaven on 2" },
  THE_STARE: { result: { toggleNeeded:true,exampleTime:"00:42" }, expected: "!number toggle 00:42" },
  GRAPHIC_MEMORY: { result: { pressedPosition:"TL" }, expected: "!number press tl" },
  QUIZ_BUZZ: { result: { answer:"123456" }, expected: "!number te 123456" },
  WAVETAPPING: { result: { pressCommand:"press A1 B2 I9" }, expected: "!number press A1 B2 I9; !number submit" },
  THE_HYPERCUBE: { result: { vertex:"zig-bottom-front-left" }, expected: "!number zig-bottom-front-left" },
  THE_ULTRACUBE: { result: { vertex:"pong-zig-bottom-front-left" }, expected: "!number pong-zig-bottom-front-left" },
  STACK_EM: { result: { stacks:[["Red","Red"],["Blue"],["Green","Green"],["Yellow"]] }, expected: "!number red 1 2, blue 2 1, green 3 2, yellow 4 1" },
  COLORED_KEYS: { result: { keyPosition:3 }, expected: "!number 3" },
  THE_TROLL: { result: { prepCommand:"press 9" }, expected: "!number press 9" },
  PLANETS: { result: { code:"012345" }, expected: "!number press 012345 space" },
  DIGIT_STRING: { result: { answer:12345 }, expected: "!number submit 12345" },
  HIDDEN_COLORS: { result: {}, expected: "" },
  THE_TRIANGLE_BUTTON: { result: { action:"HOLD",targetDigit:3 }, expected: "!number hold 3" },
  GRYPHONS: { result: { birdType:"Blue Jay",catType:"Snow Leopard",accessory:"Headphones" }, expected: "!number submit blue jay snow leopard headphones" },
  MORSE_BUTTONS: { result: { pressPositions:[1,3,6] }, expected: "!number press 1 3 6" },
  DAYLIGHT_DIRECTIONS: { result: { turnDirection:"COUNTERCLOCKWISE",turnCount:3 }, expected: "!number ccw 3; !number submit" },
  MODULUS_MANIPULATION: { result: { submission:"007",minutesRemaining:4 }, expected: "!number 007 4" },
  THE_BLOCK: { result: { presses:["BLOCK","BLOCK"] }, expected: "!number press block block" },
  TRANSMITTED_MORSE: { result: { entries:[{slider:1,position:3},{slider:2,position:15}] }, expected: "!number 1 3;2 15" },
  A_MISTAKE: { result: { twitchCommand:"touch 06" }, expected: "!number touch 06" },
  GREEN_ARROWS: { result: { direction:"up" }, expected: "!number up" },
  RED_ARROWS: { result: { command:"press UDLR" }, expected: "!number press UDLR" },
  YELLOW_ARROWS: { result: { direction:"left" }, expected: "!number left" },
  STICKY_NOTES: { result: { notePosition:4 }, expected: "!number select 4" },
  ORANGE_ARROWS: { result: { command:"press UDLR" }, expected: "!number press UDLR" },
  FIND_THE_DATE: { result: { weekday:"Monday" }, expected: "!number submit monday" },
  BLUE_ARROWS: { result: { command:"left up right down" }, expected: "!number left up right down" },
  BRUSH_STROKES: { result: { twitchCommand:"connect 1 2;2 3" }, expected: "!number connect 1 2;2 3" },
  HYPERACTIVE_NUMBERS: { result: { command:"submit blue odd" }, expected: "!number submit blue odd" },
  BUTTON_GRID: { result: { positions:[2,1,6,3] }, expected: "!number press 2 1 6 3" },
  PURPLE_ARROWS: { result: { action:"ddrr" }, expected: "!number ddrr" },
  ARITHMELOGIC: { result: { twitchCommand:"submit 97 98 99" }, expected: "!number submit 97 98 99" },
  INSANE_TALK: { result: { pressLabels:[5,3,7,1] }, expected: "!number label 5 3 7 1" },
  MAZEMATICS: { result: { twitchCommand:"press display up left" }, expected: "!number press display up left" },
  FORGET_THEM_ALL: { result: { command:"cut pink yellow orange" }, expected: "!number cut pink yellow orange" },
  RISKY_WIRES: { result: { cutPositions:[2,5,6] }, expected: "!number cut 2 5 6 submit" },
  SIMON_STOPS: { result: { pressColors:["BLUE","GREEN","YELLOW"] }, expected: "!number bgy" },
  ORDERED_KEYS: { result: { command:"press 123456" }, expected: "!number press 123456" },
  BORDERED_KEYS: { result: { twitchCommand:"press 0" }, expected: "!number press 0" },
  REORDERED_KEYS: { result: { command:"press 12345" }, expected: "!number press 12345" },
  SEVEN_WIRES: { result: { wirePosition:2,wireColor:"blue",rule:1 }, expected: "" },
  SEVEN_DEADLY_SINS: { result: { pressPositions:[1,3,2,7,6,5,4] }, expected: "!number press 1 3 2 7 6 5 4" },
  THE_GIANTS_DRINK: { result: { command:"left" }, expected: "!number left" },
  COLOUR_CODE: { result: { entryCommand:"press 3|r|4s4|b|5|p|6" }, expected: "!number press 3|r|4s4|b|5|p|6" },
  EQUATIONS_X: { result: { twitchCommand:"submit 116" }, expected: "!number submit 116" },
  UNORDERED_KEYS: { result: { twitchCommand:"press 3" }, expected: "!number press 3" },
  THE_NECRONOMICON: { result: { command:"page 1" }, expected: "!number page 1" },
  FAULTY_SINK: { result: { twitchCommand:"cold hot basin" }, expected: "!number cold hot basin" },
  THE_MATRIX: { result: { accessCodeNames:["Smith","Neo"], timerDigit:0 }, expected: "" },
  MISORDERED_KEYS: { result: { twitchCommand:"press 123456" }, expected: "!number press 123456" },
  ENCRYPTED_EQUATIONS: { result: { twitchCommand:"submit -12.375" }, expected: "!number submit -12.375" },
  BAMBOOZLING_BUTTON: { result: { twitchCommands:["press 07","press 03"] }, expected: "!number press 07; !number press 03" },
  VEXILLOLOGY: { result: { commands:["fill 1 red","fill 2 white","fill 3 blue","submit on 3"] }, expected: "!number fill 1 red; !number fill 2 white; !number fill 3 blue; !number submit on 3" },
  FOUR_CARD_MONTE: { result: { commands:["deal","coin 3","card 1","send 101.13"] }, expected: "!number deal; !number coin 3; !number card 1; !number send 101.13" },
  ODD_ONE_OUT: { result: { command:"press 3" }, expected: "!number press 3" },
  BABA_IS_WHO: { result: { position:4 }, expected: "" },
  MAZE_3: { result: { commands:["uurr","enter","ddl"] }, expected: "!number uurr; !number enter; !number ddl" },
  ROMAN_ART: { result: { command:"press 5 6 1 3" }, expected: "!number press 5 6 1 3" },
  STAINED_GLASS: { result: { smashPositions:["21","31","41","53","62","63","71","91"] }, expected: "!number press 21 31 41 53 62 63 71 91" },
  THE_DEALMAKER: { result: { action:"nodeal" }, expected: "!number nodeal" },
  SIMON_STORES: { result: { twitchCommand:"AMKYWGA" }, expected: "!number AMKYWGA" },
  HIEROGLYPHICS: { result: { anubisPosition:"LEFT",horusPosition:"CENTER",timerDigit:4 }, expected: "!number left center 4" },
  FUNCTIONS: { result: { answer:12345 }, expected: "!number submit 12345" },
  NEEDY_MRS_BOB: { result: { responsePosition:17 }, expected: "!number send 17" },
  SCRIPTING: { result: { usingNecessary:[false,true,false],variableType:"FLOAT",methodType:"BOOL",action:"HANDLE_SOLVE" }, expected: "!number set using1 false; !number set using2 true; !number set using3 false; !number set var float; !number set method bool; !number set action handlesolve(); !number run" },
  SIMON_SPINS: { result: { presses:["CIRCLE","PENTAGON","SQUARE"],confirmedSolved:false }, expected: "!number c p s" },
  CURSED_DOUBLE_OH: { result: { presses:["VERT1","HORIZ2","VERT2","SUBMIT"] }, expected: "!number press vert1 horiz2 vert2 submit" },
  TEN_BUTTON_COLOR_CODE: { result: { presses:[1,4,4,10] }, expected: "!number press 1 4 4 10; !number submit" },
  CRACKBOX: { result: { twitchTokens:["r","2","d","l","10"] }, expected: "!number r 2 d l 10; !number check" },
  STREET_FIGHTER: { result: { fighter:"Chun Li",opponent:"M. Bison" }, expected: "!number select Chun Li, M. Bison" },
  IMBALANCE: { result: { answer:50 }, expected: "!number press 50" },
  SEQUENCES: { result: { formula:"21n+33" }, expected: "!number submit 21n+33" },
  FAULTY_DIGITAL_ROOT: { result: { presses:["NO","YES","NO","YES"] }, expected: "!number press no yes no yes" },
  THREE_LEDS: { result: { togglePositions:[1,2,3] }, expected: "!number toggle 1 2 3; !number submit" },
  SIMPLETON: { result: { action:"PUSH" }, expected: "!number push" },
  THE_NEUTRAL_BUTTON: { result: { action:"BLINK" }, expected: "!number blink" },
  TANGRAMS: { result: { connections: [{ positivePin: 1, negativePin: 8 }, { positivePin: 2, negativePin: 1 }, { positivePin: 5, negativePin: 4 }] }, expected: "!number set 1 8; !number set 2 1; !number set 5 4" },
  BITWISE_OPERATIONS: { result: { answer: "10101010" }, expected: "!number submit 10101010" },
  FAST_MATH: { result: { answer: "05" }, expected: "!number submit 05" },
  BOOLEAN_VENN_DIAGRAM: { result: { regions: ["A", "BC", "NONE"] }, expected: "!number a bc O" },
  ZOO: { result: { animals: ["Caracal", "Orca"] }, expected: "!number press Caracal, Orca" },
  POINT_OF_ORDER: { result: { validCards: ["4S", "5D", "JS"] }, expected: "!number play 4/5/J of S/D" },
  POKER: { result: { stage: 1, call: "ALL_IN" }, expected: "!number press allin" },
  NONOGRAM: { result: { filledCells: ["B1", "A2", "C4"] }, expected: "!number fill B1 A2 C4; !number submit" },
  SET: { result: { positions: ["A1", "C2", "B3"] }, expected: "!number press a1 c2 b3" },
  HUNTING: { result: { safeButton: 4 }, expected: "!number press 4" },
  CURRICULUM: { result: { clicks: [0, 1, 2, 3, 5] }, expected: "!number click 2; !number click 3 2; !number click 4 3; !number click 5 5; !number submit" },
  PAINTING: { result: { repaints: [{ label: "A", to: "RED" }, { label: "7", to: "GRAY" }] }, expected: "!number paint A red; !number paint 7 gray" },
  MAINTENANCE: { result: { jobs: ["Windscreen chip", "Brake fluid change", "Wash"] }, expected: "!number Windscreen chip, Brake fluid change, Wash" },
  BACKGROUNDS: { result: { targetCount: 7 }, expected: "!number submit 7" },
  FAULTY_BACKGROUNDS: { result: { correctButton: "RIGHT", targetCount: 7 }, expected: "!number submit right 7" },
  MORTAL_KOMBAT: { result: { attacks: [{ controls: "⇦⇨A" }, { controls: "⇩⇩C" }, { controls: "⇦⇨B" }], fatality: { controls: "⇩⇩⇦C⇧B" } }, expected: "!number ⇦⇨A ⇩⇩C ⇦⇨B ⇩⇩⇦C⇧B" },
  MASHEMATICS: { result: { rawAnswer: 210, pressCount: 60 }, expected: "!number submit 60" },
  GREEK_CALCULUS: { result: { answer: -42 }, expected: "!number submit -42" },
  RADIATOR: { result: { temperature: 25, water: 34 }, expected: "!number submit 25 34" },
  THE_IPHONE: { result: { pin: "7259" }, expected: "!number submit 7259" },
  THE_SWAN: { result: { code: "DHARMA", buttonPositions: [1, 2, 3, 4, 5, 3] }, expected: "!number execute 1 2 3 4 5 3" },
  THE_NUMBER: { result: { code: "7271", buttonPositions: [8, 5, 8, 1] }, expected: "!number press 8 5 8 1 submit" },
  WASTE_MANAGEMENT: { result: { stageIndex: 0, barEmpty: false, allocations: [{ recycle: 75, waste: 12 }] }, expected: "!number XIIW; !number LXXVR; !number submit" },
  HUMAN_RESOURCES: { result: { fire: "REBECCA", hire: "SILAS" }, expected: "!number fire rebecca; !number hire silas" },
  EUROPEAN_TRAVEL: { result: { ticketType: "SGL", travelClass: "1st class", departure: "Ulm Hbf.", destination: "Bonn Hbf.", seat: "4B", price: "177.80" }, expected: "!number submit single ticket;1st class;Ulm Hbf.;Bonn Hbf.;4B;177.80" },
  BURGLAR_ALARM: { result: { code: "42762768" }, expected: "!number activate; !number submit 42762768" },
  ERROR_CODES: { result: { fixCode: "1011011" }, expected: "!number submit 1011011" },
  LEGOS: { result: { cells: Array(64).fill("EMPTY"), face: "TOP", orientation: "NORTH" }, expected: "" },
  PRESS_X: { result: { button: "B", validSeconds: [9, 18, 27, 36, 45, 54], anyTime: false }, expected: "!number press b on 09 18 27 36 45 54" },
  THE_CODE: { result: { code: 144 }, expected: "!number submit 144" },
  SYNONYMS: { result: { targetWord: "SEND" }, expected: "!number submit send" },
  TAP_CODE: { result: { tapCode: ["21", "45", "33", "33", "54"] }, expected: "!number tap 21 45 33 33 54" },
  DIGITAL_ROOT: { result: { button: "YES", digitalRoot: 6 }, expected: "!number press yes" },
  MARBLE_TUMBLE: { result: { timerDigits: [0, 5, 5, 9] }, expected: "!number 0; !number 5; !number 5; !number 9" },
  SKYRIM: { result: { race: "Nord", weapon: "Mace of Molag Bal", enemy: "Frost Troll", city: "Rorikstead", dragonShout: "Ice Form" }, expected: "!number submit Nord, Mace of Molag Bal, Frost Troll, Rorikstead, Ice Form" },
  THE_HANGOVER: { result: { recipe: ["Kale", "Lard"] }, expected: "" },
  BINARY_PUZZLE: { result: { solution: "001011110100010110101001011001100110" }, expected: "!number solve 001011110100010110101001011001100110" },
  FACTORY_MAZE: { result: { actions: ["left", "right", "unlock"] }, expected: "!number press left; !number press right; !number unlock" },
  BROKEN_GUITAR_CHORDS: { result: { positions: ["x", "3", "2", "0", "1", "0"] }, expected: "!number play x 3 2 0 1 0" },
  DOMINOES: { result: { order: [2, 3, 1, 4] }, expected: "!number 2314" },
  HOGWARTS: { result: { selections: [{ module: "Wires", house: "Gryffindor", points: 4 }], winningHouses: ["Gryffindor"] }, expected: "!number find Wires; !number gryffindor" },
  REGULAR_CRAZY_TALK: { result: { hold: 2, release: 4 }, expected: "!number toggle 2 4" },
  SIMON_SPEAKS: { result: { commands: ["tl", "tm", "tr", "ml", "mm"] }, expected: "!number tl tm tr ml mm" },
  DISCOLORED_SQUARES: { result: { presses: ["A1", "D4"] }, expected: "!number press A1 D4" },
  SKINNY_WIRES: { result: { coordinate: "B3" }, expected: "!number cut B3" },
  KRAZY_TALK: { result: { twitchCommand: "hold 1 on 4" }, expected: "!number hold 1 on 4" },
  NUMBERS: { result: {}, expected: "" },
  ALCHEMY: { result: {}, expected: "" },
  COOKIE_JARS: { result: { twitchCommand: "eat" }, expected: "!number eat" },
  FREE_PARKING: { result: { twitchCommand: "pay $123" }, expected: "!number pay $123" },
  SIMONS_STAGES: { result: {}, expected: "" },
  VARICOLORED_SQUARES: { result: { twitchCommand: "A1 B2" }, expected: "!number A1 B2" },
  ZONI: { result: { digit: 6 }, expected: "!number press 6" },
  MAD_MEMORY: { result: { pressPositions: [1, 4] }, expected: "!number position 14" },
  UNRELATED_ANAGRAMS: { result: { pressSequence: "UNRELATED" }, expected: "!number press UNRELATED" },
  BARTENDING: { result: { twitchCommands: ["slot 1", "bottled Rum", "serve"] }, expected: "!number slot 1; !number bottled Rum; !number serve" },
  QUESTION_MARK: { result: { holdSymbols: [2] }, expected: "!number hold" },
  DECOLORED_SQUARES: { result: { twitchCommand: "C3" }, expected: "!number C3" },
  FLAVOR_TEXT: { result: { twitchCommand: "yes" }, expected: "!number yes" },
  FLAVOR_TEXT_EX: { result: { pressLabels: ["1", "9", "4", "0"] }, expected: "!number label 1940" },
  SHAPES_AND_BOMBS: { result: { twitchCommands: ["press A1 B2", "submit"] }, expected: "!number press A1 B2; !number submit" },
  HOMOPHONES: { result: { numbers: [0, 3, 4, 3], pressPositions: [1, 2, 3, 4] }, expected: "!number set all 0 3 4 3; !number press 1234" },
  DETONATO: { result: { twitchCommand: "press A" }, expected: "!number press A" },
  SYNC_125_3: { result: { base4: "32" }, expected: "!number submit 32" },
  WESTEROS: { result: { twitchCommand: "submit Stark Arya Stark WinterisComing Winterfell" }, expected: "!number submit Stark Arya Stark WinterisComing Winterfell" },
};

describe("generateTwitchCommand", () => {
  it("has an audited fixture and support status for every module", () => {
    expect(Object.keys(fixtures).sort()).toEqual(Object.values(ModuleType).sort());
    expect(Object.keys(TWITCH_COMMAND_SUPPORT).sort()).toEqual(Object.values(ModuleType).sort());
    expect(Object.values(TWITCH_COMMAND_SUPPORT).filter((status) => status === "verified")).toHaveLength(362);
    expect(Object.values(TWITCH_COMMAND_SUPPORT).filter((status) => status === "conditional")).toHaveLength(44);
    expect(Object.values(TWITCH_COMMAND_SUPPORT).filter((status) => status === "unavailable")).toHaveLength(12);
  });

  for (const moduleType of Object.values(ModuleType)) {
    it(`generates the verified ${moduleType} command`, () => {
      const fixture = fixtures[moduleType];
      expect(generateTwitchCommand({ moduleType, result: fixture.result })).toBe(fixture.expected);
      expect(fixture.expected).not.toContain("unknown");
      if (TWITCH_COMMAND_SUPPORT[moduleType] === "verified") expect(fixture.expected).not.toBe("");
    });
  }

  it("uses submit only for the fourth Two Bits response", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.TWO_BITS,
      result: { letters: "gz", stages: [{}, {}, {}, {}] },
    })).toBe("!number press g z submit");
  });

  it("omits Neutralization's rejected no-op base command for the default NH3 selection", () => {
    expect(generateTwitchCommand({ moduleType: ModuleType.NEUTRALIZATION, result: { baseFormula: "NH3", drops: 4, filterOn: false } }))
      .toBe("!number conc set 4; !number titrate");
  });

  it("covers The Time Keeper's accepted LED and time widths", () => {
    expect(generateTwitchCommand({ moduleType: ModuleType.THE_TIME_KEEPER, result: { correctLed: 1, finalNumber: 51 } }))
      .toBe("!number press 1 at 0:51");
    expect(generateTwitchCommand({ moduleType: ModuleType.THE_TIME_KEEPER, result: { correctLed: 2, finalNumber: 75 } }))
      .toBe("!number press 2 at 1:15");
    expect(generateTwitchCommand({ moduleType: ModuleType.THE_TIME_KEEPER, result: { correctLed: 3, finalNumber: 10 } }))
      .toBe("!number press 3 at 0:20");
  });

  it("covers every default Black Hole gesture", () => {
    const expected = [
      "hold tick release", "tap tick tap", "tap tick hold tick release",
      "hold tick release hold tick release", "hold tick tick release", "tap tap",
    ];
    [0, 1, 2, 3, 4, "C"].forEach((digit, index) => {
      expect(generateTwitchCommand({ moduleType: ModuleType.BLACK_HOLE, result: { digit } }))
        .toBe(`!number ${expected[index]}`);
    });
  });

  it("presses the Logical Buttons operator when no button is valid", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.LOGICAL_BUTTONS,
      result: { pressButtons: [], pressOperator: true },
    })).toBe("!number press operator");
  });

  it("does not submit an ambiguous password candidate", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.EXTENDED_PASSWORD,
      result: { possibleWords: ["anchor", "adjust"] },
    })).toBe("");
  });

  it("generates the anterodiametric Symbol Cycle command", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.SYMBOL_CYCLE,
      result: { mode: "ANTERODIAMETRIC", clickScreen: "RIGHT", clicks: 4 },
    })).toBe("!number click right 4; !number flip");
  });

  it("returns no timed Square Button command when the exact timer value is unknown", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.SQUARE_BUTTON,
      result: { hold: false, instruction: "Release when the two seconds digits add up to 7" },
    })).toBe("");
  });

  it("uses down directly when a Button Sequence panel needs no button presses", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.BUTTON_SEQUENCE,
      result: { actions: ["SKIP", "SKIP", "SKIP"] },
    })).toBe("!number down");
  });

  it("withholds Button Sequence commands that depend on the runtime hold LED", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.BUTTON_SEQUENCE,
      result: { actions: ["PRESS", "HOLD", "SKIP"] },
    })).toBe("");
  });

  it("returns no Monsplode Trading Cards trade command without the current selection", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.MONSPLODE_TRADING_CARDS,
      result: { action: "TRADE", tradeCard: 2 },
    })).toBe("");
  });

  it("returns no Hunting command without all five button pictograms", () => {
    expect(generateTwitchCommand({ moduleType: ModuleType.HUNTING, result: { decoys: ["h_"] } })).toBe("");
  });

  it("returns no iPhone command before all four digits are known", () => {
    expect(generateTwitchCommand({ moduleType: ModuleType.THE_IPHONE, result: { pin: null } })).toBe("");
  });

  it("returns no Swan command without the final randomized button positions", () => {
    expect(generateTwitchCommand({ moduleType: ModuleType.THE_SWAN, result: { code: "DHARMA" } })).toBe("");
  });

  it("returns no Stopwatch command for a runtime the upstream parser cannot express", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.THE_STOPWATCH,
      result: { runtimeSeconds: 60 },
    })).toBe("");
  });

  it("returns no Waste Management command without the current empty-bar state", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.WASTE_MANAGEMENT,
      result: { stageIndex: 0, allocations: [{ recycle: 75, waste: 12 }] },
    })).toBe("");
  });

  it("uses the untouched Cruel grid for the BOB exception", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.GAME_OF_LIFE_CRUEL,
      result: { whiteCells: [], submitInitial: true },
    })).toBe("!number submit");
  });

  it.each([
    [ModuleType.CAPACITOR_DISCHARGE, {}],
    [ModuleType.COLORED_SQUARES, { coordinates: ["E1"] }],
    [ModuleType.ENGLISH_TEST, { answerPosition: 5 }],
    [ModuleType.PLUMBING, { rotations: ["G1"], submit: true }],
    [ModuleType.POLYHEDRAL_MAZE, { relativeDirections: [2, 2, 1, 1] }],
    [ModuleType.PAINTING, { repaints: [{ label: "", to: "RED" }] }],
    [ModuleType.POETRY, { correctWords: [] }],
    [ModuleType.SEMAPHORE, { currentIndex: 0, targetIndex: -1 }],
    [ModuleType.SONIC_THE_HEDGEHOG, { button: "start" }],
    [ModuleType.TIMEZONE, { submission: "355" }],
    [ModuleType.SYMBOLIC_COORDINATES, { coordinate: "AA" }],
    [ModuleType.ALGEBRA, { answer: "1..2" }],
    [ModuleType.ALGEBRA, { answer: "123456789012" }],
    [ModuleType.VENTING_GAS, { answer: "maybe" }],
    [ModuleType.WORD_SEARCH, { start: "A1", end: "G7" }],
  ])("withholds %s when its manual Twitch data is unsafe", (moduleType, result) => {
    expect(generateTwitchCommand({ moduleType, result })).toBe("");
  });

  it("allows a zero-rotation Plumbing solution after explicit confirmation", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.PLUMBING,
      result: { rotations: [], submit: true },
    })).toBe("!number submit");
  });

  it("generates a verified Functions query command before identification", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.FUNCTIONS,
      result: { answer: null, suggestedQuery: [1, 1234] },
    })).toBe("!number query 1, 1234");
  });

  it("emits only the currently revealed Poker stage", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.POKER,
      result: { stage: 2, call: "ALL_IN", truthOrBluff: "BLUFF" },
    })).toBe("!number press bluff");
    expect(generateTwitchCommand({
      moduleType: ModuleType.POKER,
      result: { stage: 3, call: "ALL_IN", truthOrBluff: "BLUFF", cardPosition: 4 },
    })).toBe("!number press card4");
  });
});
