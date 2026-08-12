import { useMemo, useState } from "react";
import { solveSouvenir, type SouvenirOutput } from "../../services/souvenirService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";
import { XRAY_SYMBOLS, XRaySymbol } from "./XRaySolver";
import { HUNTING_CLUES } from "../../services/huntingService";
import { HuntingPictogram } from "./HuntingSolver";
import { BraillePattern } from "./BrailleSolver";
import PatternCubeSymbol, { PATTERN_CUBE_SYMBOLS } from "../common/PatternCubeSymbol";
import { SYMBOLIC_COORDINATE_SYMBOLS, type SymbolicCoordinateSymbol } from "../../services/symbolicCoordinatesService";
import { SymbolicCoordinateGlyph } from "./SymbolicCoordinateGlyph";

type QuestionOption = { id: string; label: string };
type HistoryEntry = { question: string; answer: string };
type SouvenirState = {
  sourceModuleId: string;
  question: string;
  exactQuestion: string;
  answers: string[];
  finalQuestion: boolean;
  result: SouvenirOutput | null;
  history: HistoryEntry[];
};

const question = (id: string, label: string): QuestionOption => ({ id, label });
const FLAGS_COUNTRIES_QUESTION = "Which of these country flags was shown, but not the main country flag, in Flags?";
const LOGICAL_BUTTONS_STAGES = ["first", "second", "third"];
const LOGICAL_BUTTONS_POSITIONS = ["top", "bottom-left", "bottom-right"];
const LOGICAL_BUTTONS_QUESTIONS = [
  ...LOGICAL_BUTTONS_STAGES.flatMap((stage) => LOGICAL_BUTTONS_POSITIONS.map((position) =>
    question(`color ${position} ${stage}`, `Color of the ${position} button in the ${stage} stage`))),
  ...LOGICAL_BUTTONS_STAGES.flatMap((stage) => LOGICAL_BUTTONS_POSITIONS.map((position) =>
    question(`label ${position} ${stage}`, `Label of the ${position} button in the ${stage} stage`))),
  ...LOGICAL_BUTTONS_STAGES.map((stage) =>
    question(`operator ${stage}`, `Final operator in the ${stage} stage`)),
];
const SIMON_ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
const SIMON_SINGS_QUESTIONS = ["first", "second", "third"].flatMap((stage) =>
  SIMON_ORDINALS.map((position) => question(
    `flash ${position} ${stage}`,
    `Key color that flashed ${position} in the ${stage} stage`,
  )),
);
const SIMON_SHRIEKS_QUESTIONS = SIMON_ORDINALS.map((position) => question(
  `flash ${position}`,
  `Spaces clockwise from the arrow for the ${position} flash in the final sequence`,
));
const SIMONS_STAR_QUESTIONS = SIMON_ORDINALS.slice(0, 5).map((position) => question(
  `flash ${position}`,
  `Color that flashed ${position}`,
));
const TEN_BUTTON_ORDINALS = [...SIMON_ORDINALS, "ninth", "tenth"];
const TEN_BUTTON_COLOR_CODE_QUESTIONS = ["first", "second"].flatMap(stage =>
  TEN_BUTTON_ORDINALS.map(position => question(
    `color ${position} ${stage}`,
    `Initial color of the ${position} button — ${stage} stage`,
  )),
);
const HORRIBLE_MEMORY_ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];
const HORRIBLE_MEMORY_COLORS = ["blue", "green", "red", "orange", "purple", "pink"];
const HORRIBLE_MEMORY_QUESTIONS = HORRIBLE_MEMORY_ORDINALS.slice(0, 4).flatMap((stage) => [
  ...HORRIBLE_MEMORY_ORDINALS.flatMap((position) => [
    question(`What was the color of the button in the ${position} position in the ${stage} stage of Horrible Memory?`, `Color at ${position} position — ${stage} stage`),
    question(`What was the label of the button in the ${position} position in the ${stage} stage of Horrible Memory?`, `Label at ${position} position — ${stage} stage`),
  ]),
  ...HORRIBLE_MEMORY_ORDINALS.flatMap((label) => [
    question(`What was the color of the button labeled ${HORRIBLE_MEMORY_ORDINALS.indexOf(label) + 1} in the ${stage} stage of Horrible Memory?`, `Color of label ${HORRIBLE_MEMORY_ORDINALS.indexOf(label) + 1} — ${stage} stage`),
    question(`What was the position of the button labeled ${HORRIBLE_MEMORY_ORDINALS.indexOf(label) + 1} in the ${stage} stage of Horrible Memory?`, `Position of label ${HORRIBLE_MEMORY_ORDINALS.indexOf(label) + 1} — ${stage} stage`),
  ]),
  ...HORRIBLE_MEMORY_COLORS.flatMap((color) => [
    question(`What was the label of the ${color} button in the ${stage} stage of Horrible Memory?`, `Label of ${color} — ${stage} stage`),
    question(`What was the position of the ${color} button in the ${stage} stage of Horrible Memory?`, `Position of ${color} — ${stage} stage`),
  ]),
  question(`What number was displayed in the ${stage} stage of Horrible Memory?`, `Displayed number — ${stage} stage`),
]);
const QUINTUPLES_ORDINALS = ["first", "second", "third", "fourth", "fifth"];
const QUINTUPLES_QUESTIONS = [
  ...QUINTUPLES_ORDINALS.flatMap((slot) => QUINTUPLES_ORDINALS.flatMap((digit) => [
    question(`What was the ${digit} digit in the ${slot} slot in Quintuples?`, `${digit} digit — ${slot} slot`),
    question(`What color was the ${digit} digit in the ${slot} slot in Quintuples?`, `Color of ${digit} digit — ${slot} slot`),
  ])),
  ...["red", "blue", "orange", "green", "pink"].map(color => question(`How many numbers were ${color} in Quintuples?`, `Number of ${color} flashes`)),
];
const QUESTIONS: Partial<Record<ModuleType, QuestionOption[]>> = {
  [ModuleType.MAFIA]: [question("players", "Who was a player, but not the Godfather?")],
  [ModuleType.CALENDAR]: [question("holiday", "What was the holiday?")],
  [ModuleType.USA_MAZE]: [question("departureState", "Which state did you depart from?")],
  [ModuleType.BUTTON]: [question("stripColor", "What color did the light glow?")],
  [ModuleType.BIG_CIRCLE]: [question("spinDirection", "Which direction was the circle spinning?")],
  [ModuleType.BOGGLE]: [question("visibleLetters", "Which letters were initially visible?")],
  [ModuleType.HORRIBLE_MEMORY]: HORRIBLE_MEMORY_QUESTIONS,
  [ModuleType.SONIC_KNUCKLES]: [question("badnik", "Which badnik was shown?"), question("monitor", "Which monitor was shown?")],
  [ModuleType.QUINTUPLES]: QUINTUPLES_QUESTIONS,
  [ModuleType.THE_SPHERE]: ["first", "second", "third", "fourth", "fifth"].map(position => question(`What was the ${position} flashed color in The Sphere?`, `${position} flashed color`)),
  [ModuleType.COFFEEBUCKS]: [question("sugar", "Last customer’s preferred sugar content"), question("time", "Last customer’s preferred time of day"), question("stress", "Last customer’s preferred stress level"), question("size", "Last customer’s preferred size")],
  [ModuleType.LIONS_SHARE]: [question("year", "Which year was displayed?"), question("removedLions", "Which lion was present but removed?")],
  [ModuleType.SNOOKER]: [question("reds", "How many red balls were there at the start?")],
  [ModuleType.ACCUMULATION]: [question("borderColor", "What was the border color?"), ...["first","second","third","fourth","fifth"].map(stage=>question(`background ${stage}`,`Background color in the ${stage} stage`))],
  [ModuleType.T_WORDS]: [question("words", "Which word was present?")],
  [ModuleType.DIVIDED_SQUARES]: [question("pressedColor", "What color was shown while pressing the correct square?")],
  [ModuleType.VALVES]: [question("initialState", "What was the initial valve state?")],
  [ModuleType.BLOCKBUSTERS]: [question("firstLetters", "Which letter was in the leftmost column at the start?")],
  [ModuleType.CATCHPHRASE]: ["top-left","top-right","bottom-left","bottom-right"].map(position=>question(`color ${position}`,`What was the color of the ${position} panel?`)),
  [ModuleType.ENCRYPTED_MORSE]: [question("key","What was the received key?")],
  [ModuleType.RETIREMENT]: [question("houses", "Which house was offered, but not chosen?")],
  [ModuleType.SCHLAG_DEN_BOMB]: [question("contestantName", "What was the contestant’s name?"), question("contestantScore", "What was the contestant’s score?"), question("bombScore", "What was the bomb’s score?")],
  [ModuleType.MAHJONG]: [question("countingTile", "Which tile was shown in the bottom-left?")],
  [ModuleType.KUDOSUDOKU]: [question("prefilled", "Which square was pre-filled?"), question("not prefilled", "Which square was not pre-filled?")],
  [ModuleType.CHALLENGE_AND_CONTACT]: ["first", "second", "third"].map(ordinal => question(`letter ${ordinal}`, `What was the ${ordinal} displayed letter?`)),
  [ModuleType.THE_LABYRINTH]: [
    ...["1 (Red)", "2 (Orange)", "3 (Yellow)", "4 (Green)", "5 (Blue)"].map((layer, index) => question(`portal locations layer ${index + 1}`, `Portal locations in layer ${layer}`)),
    ...Array.from({ length: 42 }, (_, index) => `${String.fromCharCode(65 + index % 6)}${Math.floor(index / 6) + 1}`).filter(coordinate => coordinate !== "F1").map(coordinate => question(`portal layers ${coordinate}`, `Layer(s) containing portal ${coordinate}`)),
  ],
  [ModuleType.FUNCTIONS]: [
    question("first query last digit", "What was the last digit of the first query result?"),
    question("left number", "What number was left of the displayed letter?"),
    question("letter", "What letter was displayed?"),
    question("right number", "What number was right of the displayed letter?"),
  ],
  [ModuleType.CURSED_DOUBLE_OH]: [question("initialFirstDigit", "What was the first digit of the initially displayed number?")],
  [ModuleType.TEN_BUTTON_COLOR_CODE]: TEN_BUTTON_COLOR_CODE_QUESTIONS,
  [ModuleType.THREE_LEDS]: [question("initialState", "What was the initial state of the LEDs?")],
  [ModuleType.MEMORY]: [
    question("displays", "What was displayed in each stage?"),
    question("positions", "What positions were pressed?"),
    question("labels", "What labels were pressed?"),
  ],
  [ModuleType.SIMON_SAYS]: [question("finalSequence", "Which colors flashed in the final sequence?")],
  [ModuleType.WIRE_SEQUENCES]: [question("colorCounts", "How many wires of each color were there?")],
  [ModuleType.BUTTON_SEQUENCE]: [
    question("redButtonCount", "How many red buttons were there?"),
    question("blueButtonCount", "How many blue buttons were there?"),
    question("yellowButtonCount", "How many yellow buttons were there?"),
    question("whiteButtonCount", "How many white buttons were there?"),
  ],
  [ModuleType.WHOS_ON_FIRST]: [question("displays", "What were the display words?")],
  [ModuleType.THIRD_BASE]: [
    question("firstDisplay", "What was the display word in the first stage?"),
    question("secondDisplay", "What was the display word in the second stage?"),
  ],
  [ModuleType.BITMAPS]: [
    question("whitePixels", "How many white pixels were in each quadrant?"),
    question("blackPixels", "How many black pixels were in each quadrant?"),
  ],
  [ModuleType.BRAILLE]: [
    question("first pattern", "What was the first Braille pattern?"),
    question("second pattern", "What was the second Braille pattern?"),
    question("third pattern", "What was the third Braille pattern?"),
    question("fourth pattern", "What was the fourth Braille pattern?"),
  ],
  [ModuleType.CHEAP_CHECKOUT]: [question("paidAmounts", "What were the paid amounts?")],
  [ModuleType.CHORD_QUALITIES]: [question("notes", "What notes were in the given chord?")],
  [ModuleType.CREATION]: [question("firstWeather", "What was the weather condition on the first day?")],
  [ModuleType.COORDINATES]: [question("gridSize", "What was the grid size?")],
  [ModuleType.COLOR_FLASH]: [question("finalColor", "What was the final color in the sequence?")],
  [ModuleType.COLOR_DECODING]: [
    question("first indicator pattern", "What was the first-stage indicator pattern?"),
    question("second indicator pattern", "What was the second-stage indicator pattern?"),
    question("third indicator pattern", "What was the third-stage indicator pattern?"),
    question("colors appeared in first indicator", "Which colors appeared in the first-stage indicator?"),
    question("colors appeared in second indicator", "Which colors appeared in the second-stage indicator?"),
    question("colors appeared in third indicator", "Which colors appeared in the third-stage indicator?"),
    question("colors did not appear in first indicator", "Which colors did not appear in the first-stage indicator?"),
    question("colors did not appear in second indicator", "Which colors did not appear in the second-stage indicator?"),
    question("colors did not appear in third indicator", "Which colors did not appear in the third-stage indicator?"),
  ],
  [ModuleType.COLOR_MORSE]: [
    question("first color", "What was the color of the first LED?"),
    question("second color", "What was the color of the second LED?"),
    question("third color", "What was the color of the third LED?"),
    question("first character", "What character was flashed by the first LED?"),
    question("second character", "What character was flashed by the second LED?"),
    question("third character", "What character was flashed by the third LED?"),
  ],
  [ModuleType.ICE_CREAM]: [
    question("customers", "Who were the customers?"),
    question("offeredFlavors", "Which flavors were offered to each customer?"),
  ],
  [ModuleType.FORGET_ME_NOT]: [question("displayedDigits", "What were the displayed digits in each stage?")],
  [ModuleType.FORGET_EVERYTHING]: [
    question("first displayed digit", "What was the first displayed digit in stage one?"),
    question("second displayed digit", "What was the second displayed digit in stage one?"),
    question("third displayed digit", "What was the third displayed digit in stage one?"),
    question("fourth displayed digit", "What was the fourth displayed digit in stage one?"),
    question("fifth displayed digit", "What was the fifth displayed digit in stage one?"),
    question("sixth displayed digit", "What was the sixth displayed digit in stage one?"),
    question("seventh displayed digit", "What was the seventh displayed digit in stage one?"),
    question("eighth displayed digit", "What was the eighth displayed digit in stage one?"),
    question("ninth displayed digit", "What was the ninth displayed digit in stage one?"),
    question("tenth displayed digit", "What was the tenth displayed digit in stage one?"),
  ],
  [ModuleType.FAST_MATH]: [question("lastPair", "What was the last pair of letters?")],
  [ModuleType.LONDON_UNDERGROUND]: [
    question("first departure", "Where did the first journey depart from?"),
    question("first arrival", "Where did the first journey arrive to?"),
    question("second departure", "Where did the second journey depart from?"),
    question("second arrival", "Where did the second journey arrive to?"),
    question("third departure", "Where did the third journey depart from?"),
    question("third arrival", "Where did the third journey arrive to?"),
  ],
  [ModuleType.MASHEMATICS]: [
    question("first number", "What was the first number in the equation?"),
    question("second number", "What was the second number in the equation?"),
    question("third number", "What was the third number in the equation?"),
  ],
  [ModuleType.LOGIC_GATES]: [
    question("gateA", "What was gate A?"),
    question("gateB", "What was gate B?"),
    question("gateC", "What was gate C?"),
    question("gateD", "What was gate D?"),
  ],
  [ModuleType.FIZZ_BUZZ]: [question("displayedNumbers", "What were the displayed numbers?")],
  [ModuleType.FLAGS]: [
    question("displayedNumber", "What was the displayed number?"),
    question("mainCountry", "What was the main country flag?"),
    question("countries", FLAGS_COUNTRIES_QUESTION),
  ],
  [ModuleType.TIMEZONE]: [
    question("departureCity", "What was the departure city?"),
    question("destinationCity", "What was the destination city?"),
  ],
  [ModuleType.SYMBOLIC_COORDINATES]: [
    question("firstLeftSymbol", "What was the left symbol in the first stage?"),
    question("firstMiddleSymbol", "What was the middle symbol in the first stage?"),
    question("firstRightSymbol", "What was the right symbol in the first stage?"),
    question("secondLeftSymbol", "What was the left symbol in the second stage?"),
    question("secondMiddleSymbol", "What was the middle symbol in the second stage?"),
    question("secondRightSymbol", "What was the right symbol in the second stage?"),
    question("thirdLeftSymbol", "What was the left symbol in the third stage?"),
    question("thirdMiddleSymbol", "What was the middle symbol in the third stage?"),
    question("thirdRightSymbol", "What was the right symbol in the third stage?"),
  ],
  [ModuleType.SONIC_THE_HEDGEHOG]: [
    question("firstPicture", "What was the first picture?"),
    question("secondPicture", "What was the second picture?"),
    question("thirdPicture", "What was the third picture?"),
    question("runningBootsSound", "Which sound played on the Running Boots screen?"),
    question("invincibilitySound", "Which sound played on the Invincibility screen?"),
    question("extraLifeSound", "Which sound played on the Extra Life screen?"),
    question("ringsSound", "Which sound played on the Rings screen?"),
  ],
  [ModuleType.ALGEBRA]: [
    question("firstEquation", "What was the first equation?"),
    question("secondEquation", "What was the second equation?"),
  ],
  [ModuleType.GAMEPAD]: [question("display", "What were the numbers on the display?")],
  [ModuleType.THE_CODE]: [question("displayedNumber", "What was the displayed number?")],
  [ModuleType.SYNONYMS]: [question("displayedNumber", "What was the displayed number?")],
  [ModuleType.TAP_CODE]: [question("receivedWord", "What was the received word?")],
  [ModuleType.GAME_OF_LIFE_CRUEL]: [question("colorCombinations", "Which color combinations occurred?")],
  [ModuleType.LED_ENCRYPTION]: [question("stageLetters", "Which letters were present at each stage?")],
  [ModuleType.LOGICAL_BUTTONS]: LOGICAL_BUTTONS_QUESTIONS,
  [ModuleType.LED_GRID]: [question("unlitCount", "How many LEDs were unlit?")],
  [ModuleType.LEGOS]: [
    question("red", "What were the dimensions of the red piece?"),
    question("green", "What were the dimensions of the green piece?"),
    question("blue", "What were the dimensions of the blue piece?"),
    question("cyan", "What were the dimensions of the cyan piece?"),
    question("magenta", "What were the dimensions of the magenta piece?"),
    question("yellow", "What were the dimensions of the yellow piece?"),
  ],
  [ModuleType.LISTENING]: [question("sound", "What sound played?")],
  [ModuleType.MAZES]: [question("startingPosition", "What was the starting position?")],
  [ModuleType.MONSPLODE_FIGHT]: [
    question("creature", "Which creature was displayed?"),
    question("moves", "Which moves were selectable?"),
  ],
  [ModuleType.MONSPLODE_TRADING_CARDS]: [
    question("cardNames", "Which cards were in the hand before the final action?"),
    question("printVersions", "Which print versions were in the hand before the final action?"),
  ],
  [ModuleType.MORSEMATICS]: [question("letters", "What were the received letters?")],
  [ModuleType.MORSE_A_MAZE]: [
    question("startingCoordinate", "What was the starting location?"),
    question("endingCoordinate", "What was the ending location?"),
    question("morseCodeWord", "What word was shown as Morse code?"),
  ],
  [ModuleType.MOUSE_IN_THE_MAZE]: [question("torusColor", "What color was the torus?")],
  [ModuleType.MURDER]: [
    question("potentialSuspectNotMurderer", "Which was a potential suspect but not the murderer?"),
    question("notPotentialSuspect", "Which was not a potential suspect?"),
    question("potentialWeaponNotMurderWeapon", "Which was a potential weapon but not the murder weapon?"),
    question("notPotentialWeapon", "Which was not a potential weapon?"),
    question("bodyLocation", "Where was the body found?"),
  ],
  [ModuleType.DR_DOCTOR]: [
    question("diseases", "Which diseases were listed, but not treated?"),
    question("symptoms", "Which symptoms were listed, excluding the one still visible?"),
  ],
  [ModuleType.MYSTIC_SQUARE]: [question("centerDigit", "What digit was initially in the center?")],
  [ModuleType.NEUTRALIZATION]: [
    question("acidColor", "What was the acid's color?"),
    question("acidVolume", "What was the acid's volume?"),
  ],
  [ModuleType.ONLY_CONNECT]: [question("hieroglyphs", "Where were the Egyptian hieroglyphs?")],
  [ModuleType.PERSPECTIVE_PEGS]: [question("initialSequence", "What was the initial color sequence?")],
  [ModuleType.POLYHEDRAL_MAZE]: [question("startPosition", "What was the starting position?")],
  [ModuleType.PROBING]: [
    question("red-white", "Missing frequency in the red-white wire"),
    question("yellow-black", "Missing frequency in the yellow-black wire"),
    question("green", "Missing frequency in the green wire"),
    question("gray", "Missing frequency in the gray wire"),
    question("yellow-red", "Missing frequency in the yellow-red wire"),
    question("red-blue", "Missing frequency in the red-blue wire"),
  ],
  [ModuleType.RHYTHMS]: [question("color", "What was the color?")],
  [ModuleType.SEA_SHELLS]: [question("phrases", "What were the phrases?")],
  [ModuleType.SHAPE_SHIFT]: [question("initialShape", "What was the initial shape?")],
  [ModuleType.SILLY_SLOTS]: [question("slots", "What were the slots in each stage?")],
  [ModuleType.SIMON_SCREAMS]: [
    question("finalSequence", "What colors flashed in the final sequence?"),
    question("rules", "Which rules applied in each stage?"),
  ],
  [ModuleType.SIMON_STATES]: [question("flashes", "Which colors flashed in each stage?")],
  [ModuleType.SIMON_SINGS]: SIMON_SINGS_QUESTIONS,
  [ModuleType.SIMON_SENDS]: [
    question("red received letter", "What was the red received letter?"),
    question("green received letter", "What was the green received letter?"),
    question("blue received letter", "What was the blue received letter?"),
  ],
  [ModuleType.SIMONS_STAR]: SIMONS_STAR_QUESTIONS,
  [ModuleType.MORSE_WAR]: [
    question("transmittedCode", "Code transmitted in Morse"),
    question("led bottom", "LEDs in the bottom row"),
    question("led middle", "LEDs in the middle row"),
    question("led top", "LEDs in the top row"),
  ],
  [ModuleType.MAZE_SCRAMBLER]: [
    question("startPosition", "Starting position"),
    question("goalPosition", "Goal position"),
    question("mazeMarkings", "Which positions were maze markings?"),
  ],
  [ModuleType.ALPHABET_NUMBERS]: [
    question("displayedNumbers first", "Numbers in the first stage"),
    question("displayedNumbers second", "Numbers in the second stage"),
    question("displayedNumbers third", "Numbers in the third stage"),
    question("displayedNumbers fourth", "Numbers in the fourth stage"),
  ],
  [ModuleType.DOUBLE_COLOR]: [
    question("screenColor first", "Screen color in the first stage"),
    question("screenColor second", "Screen color in the second stage"),
  ],
  [ModuleType.MARITIME_FLAGS]: [
    question("bearing", "Signalled bearing"),
    question("callsign", "Signalled callsign"),
  ],
  [ModuleType.PATTERN_CUBE]: [question("highlightedSymbol", "Highlighted symbol")],
  [ModuleType.KNOW_YOUR_WAY]: [
    question("arrowDirection", "Arrow direction"),
    question("greenLed", "Green LED position"),
  ],
  [ModuleType.SPLITTING_THE_LOOT]: [question("initiallyColoredBag", "Initially colored bag")],
  [ModuleType.CHARACTER_SHIFT]: [
    question("unsubmittedLetters", "Unsubmitted slider letter"),
    question("unsubmittedDigits", "Unsubmitted slider digit"),
  ],
  [ModuleType.SIMON_SAMPLES]: [
    question("call first", "Call samples played in the first stage"),
    question("call second", "Call samples added in the second stage"),
    question("call third", "Call samples added in the third stage"),
  ],
  [ModuleType.DRAGON_ENERGY]: [question("indicatorColor", "Indicator color")],
  [ModuleType.UNCOLORED_SQUARES]: [
    question("firstStageColor first", "First color in reading order in the first stage"),
    question("firstStageColor second", "Other least-common color in the first stage"),
  ],
  [ModuleType.FLASHING_LIGHTS]: ["top", "bottom"].flatMap((led) =>
    ["cyan", "green", "red", "purple", "orange"].map((color) =>
      question(`ledFrequency ${led} ${color}`, `${led[0].toUpperCase() + led.slice(1)} LED — ${color}`))),
  [ModuleType.THREE_D_TUNNELS]: [
    question("targetNode first", "First goal node"),
    question("targetNode second", "Second goal node"),
    question("targetNode third", "Third goal node"),
  ],
  [ModuleType.SYNCHRONIZATION]: [
    question("fastestLight", "Initial fastest-light position"),
    question("centerSpeed", "Initial center-light speed"),
  ],
  [ModuleType.THE_SWITCH]: ["first", "second"].flatMap((flip) => ["top", "bottom"].map((led) =>
    question(`ledColor ${led} ${flip}`, `${led[0].toUpperCase() + led.slice(1)} LED on the ${flip} flip`))),
  [ModuleType.REVERSE_MORSE]: ["first", "second"].flatMap((message) =>
    ["first", "second", "third", "fourth", "fifth", "sixth"].flatMap((position) => [
      question(`symbol ${position} ${message}`, `${position[0].toUpperCase() + position.slice(1)} symbol in the ${message} message`),
      question(`color ${position} ${message}`, `Color of the ${position} symbol in the ${message} message`),
    ])),
  [ModuleType.SIMON_SHRIEKS]: SIMON_SHRIEKS_QUESTIONS,
  [ModuleType.SKEWED_SLOTS]: [question("originalNumber", "What were the original numbers?")],
  [ModuleType.SWITCHES]: [question("initialPosition", "What was the initial switch position?")],
  [ModuleType.SYMBOL_CYCLE]: [
    question("leftSymbolCount", "How many symbols cycled on the left screen?"),
    question("rightSymbolCount", "How many symbols cycled on the right screen?"),
  ],
  [ModuleType.COLORED_SWITCHES]: [question("initialPosition", "What was the initial position of the switches?")],
  [ModuleType.BLIND_MAZE]: [
    question("northButtonColor", "What color was the north button?"),
    question("eastButtonColor", "What color was the east button?"),
    question("southButtonColor", "What color was the south button?"),
    question("westButtonColor", "What color was the west button?"),
  ],
  [ModuleType.SOUVENIR]: [question("firstModule", "What was the first module asked about?")],
  [ModuleType.THE_BULB]: [question("initiallyLit", "Was the bulb initially lit?")],
  [ModuleType.THE_CUBE]: [
    question("first rotation", "What was the first cube rotation?"),
    question("second rotation", "What was the second cube rotation?"),
    question("third rotation", "What was the third cube rotation?"),
    question("fourth rotation", "What was the fourth cube rotation?"),
    question("fifth rotation", "What was the fifth cube rotation?"),
    question("sixth rotation", "What was the sixth cube rotation?"),
  ],
  [ModuleType.JEWEL_VAULT]: [
    question("wheel 1", "Which wheel turned as a result of turning wheel 1?"),
    question("wheel 2", "Which wheel turned as a result of turning wheel 2?"),
    question("wheel 3", "Which wheel turned as a result of turning wheel 3?"),
    question("wheel 4", "Which wheel turned as a result of turning wheel 4?"),
  ],
  [ModuleType.THREE_D_MAZE]: [
    question("markings", "What were the markings?"),
    question("cardinalDirection", "What was the cardinal direction?"),
  ],
  [ModuleType.TIC_TAC_TOE]: [question("initialField", "What was the initial state of the field?")],
  [ModuleType.TWO_BITS]: [question("responses", "What were the correct query responses?")],
  [ModuleType.X_RAY]: [question("symbols", "Which symbols were scanned?")],
  [ModuleType.GRIDLOCK]: [
    question("startingColor", "What was the starting color?"),
    question("startingLocation", "What was the starting location?"),
  ],
  [ModuleType.YAHTZEE]: [question("firstRoll", "What was the first roll?")],
  [ModuleType.VISUAL_IMPAIRMENT]: [
    question("first desired color", "What was the desired color in the first stage?"),
    question("second desired color", "What was the desired color in the second stage?"),
    question("third desired color", "What was the desired color in the third stage?"),
  ],
  [ModuleType.FACTORY_MAZE]: [question("start room", "What room did the maze start in?")],
  [ModuleType.BROKEN_GUITAR_CHORDS]: [
    question("displayed chord", "What chord was displayed?"),
    question("broken string", "Which string was broken?"),
  ],
  [ModuleType.REGULAR_CRAZY_TALK]: [
    question("correct digit", "What digit was displayed by the correct phrase?"),
    question("embellishment", "What embellishment surrounded the correct phrase?"),
  ],
  [ModuleType.SIMON_SPEAKS]: [
    question("first flash", "Where was the first flashed bubble?"),
    question("second flash", "What shape was in the second flashed bubble?"),
    question("third flash", "What language was in the third flashed bubble?"),
    question("fourth flash", "What word was in the fourth flashed bubble?"),
    question("fifth flash", "What color was in the fifth flashed bubble?"),
  ],
  [ModuleType.DISCOLORED_SQUARES]: ["Blue", "Green", "Magenta", "Red", "Yellow"].map(color =>
    question(`remembered ${color}`, `Where was the remembered ${color} square?`)),
  [ModuleType.IDENTITY_PARADE]: [
    question("hairColorsWas", "Which hair colors were listed?"),
    question("hairColorsWasNot", "Which hair colors were not listed?"),
    question("buildsWas", "Which builds were listed?"),
    question("buildsWasNot", "Which builds were not listed?"),
    question("attiresWas", "Which attires were listed?"),
    question("attiresWasNot", "Which attires were not listed?"),
  ],
  [ModuleType.TEXT_FIELD]: [question("displayedLetter", "What was the displayed letter?")],
  [ModuleType.HUNTING]: [
    question("firstDisplayedSymbols", "Which pictograms were displayed in the first stage?"),
    question("secondDisplayedSymbols", "Which pictograms were displayed in the second stage?"),
    question("thirdDisplayedSymbols", "Which pictograms were displayed in the third stage?"),
    question("fourthDisplayedSymbols", "Which pictograms were displayed in the fourth stage?"),
  ],
  [ModuleType.THE_IPHONE]: [
    question("firstPinDigit", "What was the first PIN digit?"),
    question("secondPinDigit", "What was the second PIN digit?"),
    question("thirdPinDigit", "What was the third PIN digit?"),
    question("fourthPinDigit", "What was the fourth PIN digit?"),
  ],
  [ModuleType.BURGLAR_ALARM]: [
    question("firstDisplayedDigit", "What was the first displayed digit?"),
    question("secondDisplayedDigit", "What was the second displayed digit?"),
    question("thirdDisplayedDigit", "What was the third displayed digit?"),
    question("fourthDisplayedDigit", "What was the fourth displayed digit?"),
    question("fifthDisplayedDigit", "What was the fifth displayed digit?"),
    question("sixthDisplayedDigit", "What was the sixth displayed digit?"),
    question("seventhDisplayedDigit", "What was the seventh displayed digit?"),
    question("eighthDisplayedDigit", "What was the eighth displayed digit?"),
  ],
  [ModuleType.PIE]: [
    question("firstDisplayedDigit", "What was the first digit of the displayed number?"),
    question("secondDisplayedDigit", "What was the second digit of the displayed number?"),
    question("thirdDisplayedDigit", "What was the third digit of the displayed number?"),
    question("fourthDisplayedDigit", "What was the fourth digit of the displayed number?"),
    question("fifthDisplayedDigit", "What was the fifth digit of the displayed number?"),
  ],
  [ModuleType.PLAYFAIR_CIPHER]: [
    question("first letter", "What was the first letter of the encrypted message?"),
    question("second letter", "What was the second letter of the encrypted message?"),
    question("third letter", "What was the third letter of the encrypted message?"),
    question("fourth letter", "What was the fourth letter of the encrypted message?"),
    question("fifth letter", "What was the fifth letter of the encrypted message?"),
    question("sixth letter", "What was the sixth letter of the encrypted message?"),
    question("screen color", "What color was the screen?"),
  ],
  [ModuleType.THE_WIRE]: [
    question("topDialColor", "What was the color of the top dial?"),
    question("bottomLeftDialColor", "What was the color of the bottom-left dial?"),
    question("bottomRightDialColor", "What was the color of the bottom-right dial?"),
    question("displayedNumber", "What was the displayed number?"),
  ],
  [ModuleType.ERROR_CODES]: [question("activeErrorCode", "What was the active error code?")],
  [ModuleType.THE_SWAN]: [question("resetCount", "How many times was the system reset?")],
  [ModuleType.HUMAN_RESOURCES]: [
    question("redDescriptors", "Which descriptors were shown in red?"),
    question("greenDescriptors", "Which descriptors were shown in green?"),
    question("employees", "Who was an employee at the start?"),
    question("applicants", "Who was an applicant at the start?"),
  ],
  [ModuleType.SKYRIM]: [
    question("races", "Which races were selectable, but not the solution?"),
    question("weapons", "Which weapons were selectable, but not the solution?"),
    question("enemies", "Which enemies were selectable, but not the solution?"),
    question("cities", "Which cities were selectable, but not the solution?"),
    question("dragonShouts", "Which dragon shouts were selectable, but not the solution?"),
  ],
};
const questionsFor = (source?: BombEntity["modules"][number]) => {
  if (!source) return [];
  const questions = QUESTIONS[source.type as ModuleType] ?? [];
  if (source.type === ModuleType.VISUAL_IMPAIRMENT && Array.isArray(source.state.desiredColors)) {
    return questions.slice(0, source.state.desiredColors.length);
  }
  const discoloredRemembered = source.state.discoloredRemembered;
  if (source.type === ModuleType.DISCOLORED_SQUARES && Array.isArray(discoloredRemembered)) {
    return questions.filter((option) => discoloredRemembered.some((fact: unknown) =>
      typeof fact === "string" && option.id.toLowerCase().endsWith(fact.split(":")[0].toLowerCase())));
  }
  const counts = source?.type === ModuleType.BUTTON_SEQUENCE ? source.state.colorOccurrences : null;
  if (!counts || typeof counts !== "object") return questions;
  return questions.filter((option) => {
    const color = option.id.replace("ButtonCount", "").toUpperCase();
    return Number((counts as Record<string, unknown>)[color]) > 0;
  });
};
const humanize = (type: string) => type.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SouvenirSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [sourceModuleId, setSourceModuleId] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [exactQuestion, setExactQuestion] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [finalQuestion, setFinalQuestion] = useState(false);
  const [result, setResult] = useState<SouvenirOutput | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const sources = useMemo(
    () => bomb?.modules.filter((source) => source.solved && source.id !== currentModule?.id
      && !(source.type === ModuleType.FLAGS && source.state.unicornRule === true)
      && !(source.type === ModuleType.CALENDAR && source.state.souvenirEligible === false)) ?? [],
    [bomb?.modules, currentModule?.id],
  );
  const selectedSource = sources.find((source) => source.id === sourceModuleId);
  const requiresDisplayedAnswers = selectedSource?.type === ModuleType.MAFIA
    || (selectedSource?.type === ModuleType.FLAGS && selectedQuestion === "countries");
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.SOUVENIR, result }) : "";
  const questionOptions = questionsFor(selectedSource);
  const xRaySymbols = selectedSource?.type === ModuleType.X_RAY && result
    ? result.answer.split(", ").filter((answer) => XRAY_SYMBOLS.includes(answer))
    : [];
  const huntingSymbols = selectedSource?.type === ModuleType.HUNTING && result
    ? result.answer.split(", ").map((answer) => HUNTING_CLUES.find((symbol) => symbol.replace("_", "") === answer.trim())).filter((symbol): symbol is NonNullable<typeof symbol> => symbol !== undefined)
    : [];
  const braillePattern = selectedSource?.type === ModuleType.BRAILLE && result
    ? (result.answer.codePointAt(0) ?? 0) - 0x2800
    : 0;
  const patternCubeSymbol = selectedSource?.type === ModuleType.PATTERN_CUBE && result
    && PATTERN_CUBE_SYMBOLS.includes(result.answer) ? result.answer : "";
  const symbolicCoordinatesSymbol = selectedSource?.type === ModuleType.SYMBOLIC_COORDINATES && result
    && SYMBOLIC_COORDINATE_SYMBOLS.includes(result.answer as SymbolicCoordinateSymbol)
    ? result.answer as SymbolicCoordinateSymbol
    : null;
  const moduleState = useMemo<SouvenirState>(() => ({
    sourceModuleId, question: selectedQuestion, exactQuestion, answers, finalQuestion, result, history,
  }), [sourceModuleId, selectedQuestion, exactQuestion, answers, finalQuestion, result, history]);

  useSolverModulePersistence<SouvenirState, SouvenirOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.sourceModuleId !== undefined) setSourceModuleId(state.sourceModuleId);
      if (state.question !== undefined) setSelectedQuestion(state.question);
      if (state.exactQuestion !== undefined) setExactQuestion(state.exactQuestion);
      if (state.answers !== undefined) setAnswers(state.answers);
      if (state.finalQuestion !== undefined) setFinalQuestion(state.finalQuestion);
      if (state.result !== undefined) setResult(state.result);
      if (state.history !== undefined) setHistory(state.history);
    },
    onRestoreSolution: (solution) => { if (solution?.answer) setResult(solution); },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const selectSource = (id: string) => {
    const source = sources.find((candidate) => candidate.id === id);
    const options = questionsFor(source);
    const mafia = source?.type === ModuleType.MAFIA;
    setSourceModuleId(id);
    setSelectedQuestion(options.length === 1 ? options[0].id : "");
    setExactQuestion(mafia ? "Who was a player, but not the Godfather?" : "");
    setAnswers(mafia ? Array(6).fill("") : []);
    setResult(null);
    clearError();
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!sourceModuleId) return setError("Select the solved module named in the question");
    const questionText = answers.length ? exactQuestion.trim() : selectedQuestion.trim();
    if (!questionText) return setError("Enter or select the question shown on Souvenir");
    if (answers.length && answers.some((answer) => !answer.trim())) return setError("Enter every answer shown on Souvenir");
    clearError(); setIsLoading(true);
    try {
      const input = {
        sourceModuleId, question: questionText, finalQuestion,
        ...(answers.length ? { answers: answers.map((answer) => answer.trim()) } : {}),
      };
      const response = await solveSouvenir(round.id, bomb.id, currentModule.id, input);
      if (!response.output) return setError(response.reason);
      const label = answers.length ? questionText : questionOptions.find((option) => option.id === selectedQuestion)?.label ?? selectedQuestion;
      const nextHistory = [...history, { question: label, answer: response.output.answer }];
      setResult(response.output); setHistory(nextHistory); setIsSolved(Boolean(response.solved));
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { ...input, result: response.output, history: nextHistory },
        response.output, Boolean(response.solved),
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Souvenir"); }
    finally { setIsLoading(false); }
  };

  const nextQuestion = () => {
    setSourceModuleId(""); setSelectedQuestion(""); setExactQuestion(""); setAnswers([]); setFinalQuestion(false); setResult(null); clearError();
  };
  const reset = () => {
    setSourceModuleId(""); setSelectedQuestion(""); setExactQuestion(""); setAnswers([]); setFinalQuestion(false);
    setResult(null); setHistory([]); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Question source" description="Choose the solved module named by Souvenir, then select the displayed question when needed.">
      <label className="block text-sm font-medium">
        Source module
        <select
          value={sourceModuleId}
          onChange={(event) => selectSource(event.target.value)}
          disabled={isLoading || isSolved}
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select a solved module…</option>
          {sources.map((source) => <option key={source.id} value={source.id}>{humanize(source.type)} · {source.id.slice(0, 8)}</option>)}
        </select>
      </label>
      {questionOptions.length > 1 && answers.length === 0 && <label className="mt-3 block text-sm font-medium">
        Question
        <select
          value={selectedQuestion}
          onChange={(event) => {
            const nextQuestion = event.target.value;
            const needsFlagsChoices = selectedSource?.type === ModuleType.FLAGS && nextQuestion === "countries";
            setSelectedQuestion(nextQuestion);
            setExactQuestion(needsFlagsChoices ? FLAGS_COUNTRIES_QUESTION : "");
            setAnswers(needsFlagsChoices ? Array(6).fill("") : []);
            setResult(null); clearError();
          }}
          disabled={isLoading || isSolved}
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select the displayed question…</option>
          {questionOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>}
      {selectedSource && questionOptions.length === 0 && answers.length === 0 && <label className="mt-3 block text-sm font-medium">
        Exact Souvenir question
        <input
          type="text"
          value={selectedQuestion}
          onChange={(event) => { setSelectedQuestion(event.target.value); setResult(null); clearError(); }}
          disabled={isLoading || isSolved}
          placeholder="What color was the torus in Mouse In The Maze?"
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>}
      {selectedSource && <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={answers.length > 0}
          onChange={(event) => {
            setExactQuestion(event.target.checked && questionOptions.length === 0 ? selectedQuestion : "");
            setAnswers(event.target.checked ? ["", "", "", ""] : []);
            setResult(null); clearError();
          }}
          disabled={isLoading || isSolved || requiresDisplayedAnswers}
        />
        Enter Souvenir’s displayed answers (most reliable)
      </label>}
      {answers.length > 0 && <div className="mt-3 space-y-3">
        <label className="block text-sm font-medium">
          Exact Souvenir question
          <input
            type="text"
            value={exactQuestion}
            onChange={(event) => { setExactQuestion(event.target.value); setResult(null); clearError(); }}
            disabled={isLoading || isSolved}
            className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {answers.map((answer, index) => <input
            key={index}
            type="text"
            aria-label={`Answer ${index + 1}`}
            value={answer}
            onChange={(event) => setAnswers((current) => current.map((value, answerIndex) => answerIndex === index ? event.target.value : value))}
            disabled={isLoading || isSolved}
            placeholder={`Answer ${index + 1}`}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />)}
        </div>
        <div className="flex gap-2">
          {answers.length < 6 && <Button type="button" variant="outline" onClick={() => setAnswers((current) => [...current, ""])}>Add answer</Button>}
          {answers.length > 2 && <Button type="button" variant="outline" onClick={() => setAnswers((current) => current.slice(0, -1))}>Remove answer</Button>}
        </div>
      </div>}
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={finalQuestion} onChange={(event) => setFinalQuestion(event.target.checked)} disabled={isLoading || isSolved} />
        This is Souvenir’s final question
      </label>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!sourceModuleId || !(answers.length ? exactQuestion.trim() && answers.every((answer) => answer.trim()) : selectedQuestion.trim()) || Boolean(result)} solveText="Show recorded answer" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Recorded answer" className="border-emerald-500/40">
      <div className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-4 text-center font-semibold text-emerald-700 dark:text-emerald-300">
        {symbolicCoordinatesSymbol
          ? <><p className="mb-3">Match this symbol:</p><SymbolicCoordinateGlyph symbol={symbolicCoordinatesSymbol} className="mx-auto h-24 w-24" /></>
          : huntingSymbols.length > 0
          ? <><p className="mb-3">These two pictograms were displayed:</p><div className="flex justify-center gap-3">{huntingSymbols.map((symbol) => <HuntingPictogram key={symbol} symbol={symbol} />)}</div></>
          : xRaySymbols.length > 0
          ? <><p className="mb-3">Match any of these scanned symbols:</p><div className="flex justify-center gap-3">{xRaySymbols.map((symbol) => <XRaySymbol key={symbol} code={symbol} />)}</div></>
          : braillePattern > 0 && braillePattern <= 63
          ? <><p className="mb-3">Match this Braille pattern:</p><BraillePattern pattern={braillePattern} className="mx-auto w-fit scale-150" /><p className="mt-4">{result.answer}</p></>
          : patternCubeSymbol
          ? <><p className="mb-3">Match this highlighted symbol:</p><PatternCubeSymbol symbol={patternCubeSymbol} className="mx-auto h-20 w-20" /></>
          : result.answer}
      </div>
      {!isSolved && <Button type="button" className="mt-4 w-full" onClick={nextQuestion}>Next question</Button>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Select the exact solved module instance. Presets show recorded facts quickly; for an exact answer, enter Souvenir’s question and the displayed choices.</SolverInstructions>
  </SolverLayout>;
}
