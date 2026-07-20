import { describe, expect, it } from "vitest";
import { ModuleType } from "../types";
import { generateTwitchCommand, TWITCH_COMMAND_SUPPORT } from "./twitchCommands";

type Fixture = { result: unknown; expected: string };

const fixtures: Record<ModuleType, Fixture> = {
  WIRES: { result: { wirePosition: 1 }, expected: "!number cut 2" },
  BUTTON: { result: { hold: false }, expected: "!number tap" },
  KEYPADS: { result: { position: "TOP_RIGHT" }, expected: "!number press 2" },
  MEMORY: { result: { position: 3, label: 4 }, expected: "!number position 3" },
  SIMON_SAYS: { result: { presses: ["RED", "BLUE"] }, expected: "!number press red blue" },
  MORSE_CODE: { result: { frequency: 573 }, expected: "!number transmit 573" },
  FORGET_ME_NOT: { result: { sequence: [5, 3, 1] }, expected: "!number press 531" },
  SOUVENIR: { result: { answerIndex: 3 }, expected: "!number answer 3" },
  ICE_CREAM: { result: { flavor: "COOKIES_AND_CREAM" }, expected: "!number sell cookies and cream" },
  THE_SCREW: { result: { hole: 3, buttonLabel: "A" }, expected: "!number unscrew; !number screw 3; !number press A" },
  YAHTZEE: { result: { action: "ROLL_ALL", keepColors: [] }, expected: "!number roll" },
  X_RAY: { result: { button: 4 }, expected: "!number press 4" },
  BATTLESHIP: { result: { shipLocations: ["A1", "B2"] }, expected: "!number torpedo A1 B2" },
  MINESWEEPER: { result: { startingColor: "RED" }, expected: "!number dig red" },
  WHOS_ON_FIRST: { result: { buttonText: "YOU ARE" }, expected: "!number YOU ARE" },
  THIRD_BASE: { result: { button: "NHXS" }, expected: "!number NHXS" },
  VENTING_GAS: { result: { answer: "yes" }, expected: "!number yes" },
  CAPACITOR_DISCHARGE: { result: { holdSeconds: 7 }, expected: "!number hold 7" },
  COMPLICATED_WIRES: { result: { wire: 2 }, expected: "!number cut 2" },
  WIRE_SEQUENCES: { result: { wirePosition: 3 }, expected: "!number cut 3" },
  PASSWORDS: { result: { password: "about" }, expected: "!number about" },
  MAZES: { result: { directions: ["UP", "LEFT", "DOWN"] }, expected: "!number move uld" },
  KNOBS: { result: { position: "RIGHT" }, expected: "!number rotate 1" },
  COLOR_FLASH: { result: { pressYes: true, position: 3 }, expected: "!number press yes 3" },
  PIANO_KEYS: { result: { notes: ["C_SHARP", "A"] }, expected: "!number press Db A" },
  SEMAPHORE: { result: { currentIndex: 0, targetIndex: 2 }, expected: "!number move right; !number move right; !number press ok" },
  PERSPECTIVE_PEGS: { result: { pressPositions: ["Lower left", "Top"] }, expected: "!number press bl t" },
  EMOJI_MATH: { result: { answer: -47 }, expected: "!number submit -47" },
  SWITCHES: { result: { solutionSteps: [1, 5, 3] }, expected: "!number flip 1 5 3" },
  TWO_BITS: { result: { letters: "kt", stages: [{}] }, expected: "!number press k t query" },
  WORD_SCRAMBLE: { result: { solution: "stream" }, expected: "!number submit stream" },
  WORD_SEARCH: { result: { start: "B3", end: "E6" }, expected: "!number select B3 E6" },
  BROKEN_BUTTONS: { result: { action: "PRESS", column: 2, row: 1 }, expected: "!number press 2 1" },
  COMPLICATED_BUTTONS: { result: { pressOrder: [2, 4, 1] }, expected: "!number press 2 4 1" },
  ANAGRAMS: { result: { possibleSolutions: ["poodle"] }, expected: "!number submit poodle" },
  COMBINATION_LOCK: { result: { firstNumber: 1, secondNumber: 2, thirdNumber: 3 }, expected: "!number submit 1 2 3" },
  LISTENING: { result: { code: "$ & * * #" }, expected: "!number press $ & * * #" },
  FOREIGN_EXCHANGE_RATES: { result: { keyPosition: 0 }, expected: "!number press 1" },
  ROUND_KEYPAD: { result: { positions: [8, 2, 5] }, expected: "!number press 8 2 5" },
  NUMBER_PAD: { result: { code: "4236" }, expected: "!number submit 4236" },
  ORIENTATION_CUBE: { result: { rotations: ["ROTATE_CLOCKWISE", "ROTATE_LEFT"] }, expected: "!number press cw l set" },
  MORSEMATICS: { result: { letter: "F" }, expected: "!number submit ..-." },
  CONNECTION_CHECK: { result: { led1: true, led2: false, led3: true, led4: false }, expected: "!number submit green red green red" },
  LETTER_KEYS: { result: { letter: "B" }, expected: "!number press B" },
  LOGIC: { result: { answers: [false, true] }, expected: "!number submit false true" },
  ASTROLOGY: { result: { omenScore: -2 }, expected: "!number press bad on 2" },
  MYSTIC_SQUARE: { result: { targetConstellation: [1, null, 3] }, expected: "!number press 1 3" },
  CRAZY_TALK: { result: { downAt: 4, upAt: 5 }, expected: "!number toggle 4 5" },
  ADVENTURE_GAME: { result: { itemsToUse: ["POTION"], weaponToUse: "CABER" }, expected: "!number use potion, caber" },
  PLUMBING: { result: { rotations: ["A3", "B4"], submit: true }, expected: "!number rotate A3 B4; !number submit" },
  CRUEL_PIANO_KEYS: { result: { notes: ["A_SHARP", "C"] }, expected: "!number press Bb C" },
  SAFETY_SAFE: { result: { dialTurns: [1, 2, 3, 4, 5, 6] }, expected: "!number submit 1 2 3 4 5 6" },
  CRYPTOGRAPHY: { result: { keyOrder: ["N", "B", "V"] }, expected: "!number press N B V" },
  CAESAR_CIPHER: { result: { solution: "KBQ" }, expected: "!number press K B Q" },
  TURN_THE_KEY: { result: { turnWhenSeconds: 509 }, expected: "!number turn 8:29" },
  TURN_THE_KEYS: { result: { canTurnRightKey: true, rightKeyTurned: false }, expected: "!number turn right" },
  CHESS: { result: { coordinate: "C2" }, expected: "!number press C2" },
  MOUSE_IN_THE_MAZE: { result: { moves: ["FORWARD", "TURN_LEFT"] }, expected: "!number f l; !number submit" },
  HEXAMAZE: { result: { moves: ["NORTHWEST", "EAST"] }, expected: "!number northwest east" },
  BITMAPS: { result: { button: 2 }, expected: "!number press 2" },
  COLORED_SQUARES: { result: { coordinates: ["A1", "A2", "B3"] }, expected: "!number A1 A2 B3" },
  ADJACENT_LETTERS: { result: { pressLetters: ["D", "P", "C"] }, expected: "!number submit D P C" },
  SILLY_SLOTS: { result: { legal: false }, expected: "!number pull" },
  SKEWED_SLOTS: { result: { code: "1 2 3" }, expected: "!number submit 1 2 3" },
  THREE_D_MAZE: { result: { moves: ["FORWARD", "TURN_LEFT"] }, expected: "!number move F L" },
  SIMON_STATES: { result: { press: "RED" }, expected: "!number press red" },
  SIMON_SCREAMS: { result: { press: ["RED", "BLUE"] }, expected: "!number press red blue" },
  MODULES_AGAINST_HUMANITY: { result: { commands: ["press reset", "press submit"] }, expected: "!number press reset; !number press submit" },
  LAUNDRY: { result: { bobShortcut: false, washingSymbol: "WASH_80F", dryingSymbol: "TUMBLE_DRY", ironingSymbol: "IRON", specialSymbol: "BLEACH" }, expected: "!number set all 4 0 0 0; !number insert coin" },
  PROBING: { result: { redClipWire: 4, blueClipWire: 3 }, expected: "!number connect 4 3" },
  ALPHABET: { result: { pressOrder: ["A", "B", "C"] }, expected: "!number press A B C" },
  MICROCONTROLLER: { result: { pins: [{ color: "RED" }, { color: "WHITE" }] }, expected: "!number set red; !number set white" },
  MURDER: { result: { suspect: "MISS_SCARLETT", weapon: "CANDLESTICK", location: "KITCHEN" }, expected: "!number it was miss scarlett, with the candlestick, in the kitchen" },
  RESISTORS: { result: { requiredConnections: [{ inputPin: "A", outputPin: "C", path: "DIRECT" }] }, expected: "!number connect a c; !number submit" },
  GAMEPAD: { result: { sequence: ["A", "B", "◀", "R"] }, expected: "!number submit ab◀r" },
  TIC_TAC_TOE: { result: { action: "PRESS", number: 5 }, expected: "!number 5" },
  MONSPLODE_FIGHT: { result: { move: "SPLASH" }, expected: "!number use splash" },
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
  DOUBLE_OH: { result: { presses: ["SINGLE_VERTICAL", "SQUARE"] }, expected: "!number vert1 submit" },
  CHEAP_CHECKOUT: { result: { needsSecondPayment: false, change: 3.24 }, expected: "!number submit 3.24" },
  COORDINATES: { result: { matchingClues: ["2 4", "8 1"] }, expected: "!number submit 2 4; !number submit 8 1" },
  LIGHT_CYCLE: { result: { sequence: ["BLUE", "RED", "WHITE"] }, expected: "!number B R W" },
  BINARY_LEDS: { result: { recommendedColor: "RED", recommendedValue: 25 }, expected: "!number cut red 25" },
  RHYTHMS: { result: { mash: false, actions: [{ button: "BLUE", beeps: 3 }] }, expected: "!number press blue 3" },
  COLOR_MATH: { result: { colors: ["RED", "GREEN", "BLUE", "PURPLE"] }, expected: "!number set r,g,b,p; !number submit" },
  COLOR_MORSE: { result: { morse: ["-....-", "....-", "--..."] }, expected: "!number transmit -....- ....- --..." },
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
  FIZZ_BUZZ: { result: { actions: ["FIZZ", "NUMBER", "FIZZBUZZ"] }, expected: "!number submit fizz number fizzbuzz" },
  THE_CLOCK: { result: { targetTime: "12:34 PM" }, expected: "!number set 12:34 pm" },
  LED_ENCRYPTION: { result: { correctLetters: ["B"] }, expected: "!number press B" },
  BITWISE_OPERATIONS: { result: { answer: "10101010" }, expected: "!number submit 10101010" },
  FAST_MATH: { result: { answer: "05" }, expected: "!number submit 05" },
  BOOLEAN_VENN_DIAGRAM: { result: { regions: ["A", "BC", "NONE"] }, expected: "!number a bc O" },
  ZOO: { result: { animals: ["Caracal", "Orca"] }, expected: "!number press Caracal, Orca" },
  POINT_OF_ORDER: { result: { validCards: ["4S", "5D", "JS"] }, expected: "!number play 4/5/J of S/D" },
};

describe("generateTwitchCommand", () => {
  it("has an audited fixture and support status for every module", () => {
    expect(Object.keys(fixtures).sort()).toEqual(Object.values(ModuleType).sort());
    expect(Object.keys(TWITCH_COMMAND_SUPPORT).sort()).toEqual(Object.values(ModuleType).sort());
    expect(Object.values(TWITCH_COMMAND_SUPPORT).filter((status) => status === "verified")).toHaveLength(97);
    expect(Object.values(TWITCH_COMMAND_SUPPORT).filter((status) => status === "conditional")).toHaveLength(18);
  });

  for (const moduleType of Object.values(ModuleType)) {
    it(`generates the verified ${moduleType} command`, () => {
      const fixture = fixtures[moduleType];
      expect(generateTwitchCommand({ moduleType, result: fixture.result })).toBe(fixture.expected);
      expect(fixture.expected).not.toContain("unknown");
      expect(fixture.expected).not.toBe("");
    });
  }

  it("uses submit only for the fourth Two Bits response", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.TWO_BITS,
      result: { letters: "gz", stages: [{}, {}, {}, {}] },
    })).toBe("!number press g z submit");
  });

  it("returns no timed Square Button command when the exact timer value is unknown", () => {
    expect(generateTwitchCommand({
      moduleType: ModuleType.SQUARE_BUTTON,
      result: { hold: false, instruction: "Release when the two seconds digits add up to 7" },
    })).toBe("");
  });

  it.each([
    [ModuleType.CAPACITOR_DISCHARGE, {}],
    [ModuleType.COLORED_SQUARES, { coordinates: ["E1"] }],
    [ModuleType.ENGLISH_TEST, { answerPosition: 5 }],
    [ModuleType.PLUMBING, { rotations: ["G1"], submit: true }],
    [ModuleType.SEMAPHORE, { currentIndex: 0, targetIndex: -1 }],
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
});
