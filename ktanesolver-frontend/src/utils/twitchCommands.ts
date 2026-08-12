import { ModuleType } from "../types";

export interface TwitchCommandData {
  moduleType: ModuleType;
  result: unknown;
}

export type TwitchCommandSupport = "verified" | "conditional" | "unavailable";

const conditional = new Set<ModuleType>([
  ModuleType.BUTTON,
  ModuleType.CAPACITOR_DISCHARGE,
  ModuleType.COLORED_SQUARES,
  ModuleType.COORDINATES,
  ModuleType.ENGLISH_TEST,
  ModuleType.GAME_OF_LIFE_CRUEL,
  ModuleType.KNOBS,
  ModuleType.LEGOS,
  ModuleType.MOUSE_IN_THE_MAZE,
  ModuleType.MONSPLODE_TRADING_CARDS,
  ModuleType.PAINTING,
  ModuleType.PLUMBING,
  ModuleType.POLYHEDRAL_MAZE,
  ModuleType.ROUND_KEYPAD,
  ModuleType.SEMAPHORE,
  ModuleType.SQUARE_BUTTON,
  ModuleType.SYMBOLIC_PASSWORD,
  ModuleType.THE_BULB,
  ModuleType.THE_SCREW,
  ModuleType.TURN_THE_KEYS,
  ModuleType.VENTING_GAS,
  ModuleType.WORD_SEARCH,
  ModuleType.YAHTZEE,
  ModuleType.HUNTING,
  ModuleType.THE_IPHONE,
  ModuleType.THE_SWAN,
  ModuleType.THE_STOPWATCH,
  ModuleType.WASTE_MANAGEMENT,
  ModuleType.NUMBER_NIMBLENESS,
  ModuleType.NEUTRALIZATION,
  ModuleType.FAULTY_DIGITAL_ROOT,
]);

const unavailable = new Set<ModuleType>([ModuleType.UNCOLORED_SQUARES,ModuleType.THE_CRYSTAL_MAZE]);

/** Exhaustive audit status; the test suite asserts that every ModuleType is present. */
export const TWITCH_COMMAND_SUPPORT: Record<ModuleType, TwitchCommandSupport> = Object.fromEntries(
  Object.values(ModuleType).map((type) => [
    type,
    unavailable.has(type) ? "unavailable" : conditional.has(type) ? "conditional" : "verified",
  ]),
) as Record<ModuleType, TwitchCommandSupport>;

const command = (body: string | undefined): string => body?.trim() ? `!number ${body.trim()}` : "";
const commands = (bodies: Array<string | undefined>): string => bodies.filter((body): body is string => Boolean(body?.trim())).map(command).join("; ");

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

const stringValue = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;
const numberValue = (value: unknown): number | undefined => typeof value === "number" ? value : undefined;
const booleanValue = (value: unknown): boolean | undefined => typeof value === "boolean" ? value : undefined;
const arrayValue = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const strings = (value: unknown): string[] => arrayValue(value).filter((item): item is string => typeof item === "string");
const words = (value: unknown): string => String(value ?? "").toLowerCase().replaceAll("_", " ");

const NOTE_NAMES: Record<string, string> = {
  A_SHARP: "Bb", C_SHARP: "Db", D_SHARP: "Eb", F_SHARP: "Gb", G_SHARP: "Ab",
};

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..",
  J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
};

const LAUNDRY_WASH: Record<string, number> = {
  WASH_GENTLE_OR_DELICATE: 1, HAND_WASH: 2, DO_NOT_WASH: 3, WASH_80F: 4, WASH_105F: 5,
  WASH_120F: 6, WASH_95F_DOTS: 9,
};
const LAUNDRY_DRY: Record<string, number> = {
  TUMBLE_DRY: 0, LOW_HEAT_DRY: 1, MEDIUM_HEAT: 2, HIGH_HEAT: 3, NO_HEAT: 4, HANG_TO_DRY: 5,
  DRIP_DRY: 6, DRY_FLAT: 7, DO_NOT_TUMBLE_DRY: 10, DRY: 11,
};
const LAUNDRY_IRON: Record<string, number> = {
  IRON: 0, IRON_110C_230F: 2, IRON_150C_300F: 3, IRON_200C_390F: 4, NO_STEAM: 5,
};
const LAUNDRY_SPECIAL: Record<string, number> = {
  BLEACH: 0, DO_NOT_BLEACH: 1, NON_CHLORINE_BLEACH: 2, CIRCLE_TOP_LEFT: 3, ANY_SOLVENT: 4,
  NO_TETRACHLORETHYLENE: 5, PETROLEUM_SOLVENT_ONLY: 6, WET_CLEANING: 7, DO_NOT_DRYCLEAN: 8,
  SHORT_CYCLE: 9, REDUCED_MOISTURE: 10, LOW_HEAT: 11, NO_STEAM_FINISHING: 12,
};

function resistorTokens(result: Record<string, unknown>): string[] {
  const resultTokens: string[] = [];
  for (const entry of arrayValue(result.requiredConnections).map(asRecord)) {
    const input = stringValue(entry.inputPin)?.toLowerCase();
    const output = stringValue(entry.outputPin)?.toLowerCase();
    const path = stringValue(entry.path);
    if (!input || !output || !path) return [];
    const points: Record<string, string[]> = {
      DIRECT: [input, output],
      TOP: [input, "tl", "tr", output],
      BOTTOM: [input, "bl", "br", output],
      SERIES: [input, "tl", "tr", "bl", "br", output],
      PARALLEL: [input, "tl", input, "bl", "tr", output, "br", output],
    };
    if (!points[path]) return [];
    resultTokens.push(...points[path]);
  }
  return resultTokens;
}

function bulbAction(action: string): string | undefined {
  if (/^Press O\.?$/i.test(action)) return "O";
  if (/^Press I\.?$/i.test(action)) return "I";
  if (/^Unscrew/i.test(action)) return "unscrew";
  if (/^Screw/i.test(action)) return "screw";
  return undefined;
}

export function generateTwitchCommand({ moduleType, result }: TwitchCommandData): string {
  const raw = asRecord(result);

  switch (moduleType) {
    case ModuleType.COOKING: {
      const temperature = numberValue(raw.temperatureC);
      const time = numberValue(raw.timeMinutes);
      const lightOn = booleanValue(raw.lightOn);
      const setting = stringValue(raw.ovenSetting);
      const aliases: Record<string, string> = {
        BOTTOM_ELEMENT_HEAT: "beh",
        BOTTOM_ELEMENT_HEAT_WITH_GRILL: "behwg",
        CONVENTIONAL_HEATING: "ch",
        FAN_OVEN: "fo",
        GRILL: "g",
        FAN_WITH_GRILL: "fwg",
      };
      if (temperature === undefined || !Number.isInteger(temperature) || temperature < 0 || temperature > 250 || temperature % 10
        || time === undefined || !Number.isInteger(time) || time < 0 || time > 95 || time % 5
        || lightOn === undefined || !setting || !aliases[setting]) return "";
      return commands([
        `set temp ${temperature}`,
        `set time ${time}`,
        `set setting ${aliases[setting]}`,
        lightOn ? "toggle light" : undefined,
        "cook",
      ]);
    }
    case ModuleType.LONDON_UNDERGROUND: {
      const journey = arrayValue(raw.journey).map(asRecord);
      if (!journey.length || journey.length > 3) return "";
      const positions = ["top", "middle", "bottom"];
      const steps = journey.map((leg, index) => {
        const line = stringValue(leg.line);
        const station = stringValue(leg.station);
        if (!line || !station) return undefined;
        return `${positions[index]} ${line === "Hammersmith & City" ? "hammersmith" : words(line)} ${station}`;
      });
      return steps.every(Boolean) ? commands([...steps, "submit"]) : "";
    }
    case ModuleType.IDENTITY_PARADE: {
      const hair = stringValue(raw.hairColor);
      const build = stringValue(raw.build);
      const attire = stringValue(raw.attire);
      const suspect = stringValue(raw.suspect);
      if (!hair || !build || !attire || !suspect) return "";
      const attireToken = attire === "TANK_TOP" ? "tank" : attire === "T_SHIRT" ? "t-shirt" : words(attire);
      return command(`convict ${words(hair)} ${words(build)} ${attireToken} ${words(suspect)}`);
    }
    case ModuleType.MAFIA: {
      const godfather = stringValue(raw.godfather);
      return godfather ? command(`execute ${words(godfather)}`) : "";
    }
    case ModuleType.WIRES: {
      const position = numberValue(raw.wirePosition);
      return position === undefined ? "" : command(`cut ${position + 1}`);
    }
    case ModuleType.BUTTON:
      if (booleanValue(raw.hold)) return command("hold");
      if (numberValue(raw.releaseDigit) !== undefined) return command(`release ${raw.releaseDigit}`);
      return command("tap");
    case ModuleType.KEYPADS: {
      const positions = arrayValue(raw.positions).map(Number).filter(Number.isFinite);
      if (positions.length) return command(`press ${positions.join(" ")}`);
      const position = stringValue(raw.position);
      const map: Record<string, number> = { TOP_LEFT: 1, TL: 1, TOP_RIGHT: 2, TR: 2, BOTTOM_LEFT: 3, BL: 3, BOTTOM_RIGHT: 4, BR: 4 };
      return position && map[position.toUpperCase()] ? command(`press ${map[position.toUpperCase()]}`) : "";
    }
    case ModuleType.MEMORY: {
      const position = numberValue(raw.position) ?? stringValue(raw.position);
      const label = numberValue(raw.label) ?? stringValue(raw.label);
      return position !== undefined ? command(`position ${position}`) : label !== undefined ? command(`label ${label}`) : "";
    }
    case ModuleType.SIMON_SAYS: {
      const presses = strings(raw.presses).length ? strings(raw.presses) : strings(raw.sequence);
      const color = stringValue(raw.color) ?? stringValue(raw.press);
      return command(`press ${(presses.length ? presses : color ? [color] : []).map(words).join(" ")}`);
    }
    case ModuleType.MORSE_CODE: {
      const frequency = numberValue(raw.frequency);
      return frequency === undefined ? "" : command(`transmit ${frequency}`);
    }
    case ModuleType.FORGET_ME_NOT: {
      const sequence = arrayValue(raw.sequence).map(String);
      return sequence.length ? command(`press ${sequence.join("")}`) : "";
    }
    case ModuleType.FORGET_EVERYTHING: {
      const solution = stringValue(raw.solution);
      return solution && /^\d{10}$/.test(solution) ? command(`submit ${solution}`) : "";
    }
    case ModuleType.SOUVENIR: {
      const answerIndex = numberValue(raw.answerIndex);
      return answerIndex === undefined ? "" : command(`answer ${answerIndex}`);
    }
    case ModuleType.ICE_CREAM:
      return stringValue(raw.flavor) ? command(`sell ${words(raw.flavor)}`) : "";
    case ModuleType.THE_SCREW: {
      const hole = numberValue(raw.hole);
      const label = stringValue(raw.buttonLabel);
      return hole !== undefined && label ? commands(["unscrew", `screw ${hole}`, `press ${label}`]) : "";
    }
    case ModuleType.THE_CUBE: {
      const rawButtons = arrayValue(raw.buttons);
      const buttons = rawButtons.filter((button): button is number =>
        Number.isInteger(button) && Number(button) >= 1 && Number(button) <= 8);
      return buttons.length === rawButtons.length && new Set(buttons).size === buttons.length
        ? command(`execute${buttons.length ? ` ${buttons.join(" ")}` : ""}`)
        : "";
    }
    case ModuleType.TAX_RETURNS: {
      const total = numberValue(raw.totalTaxBill);
      return total !== undefined && Number.isInteger(total) && total >= 0 && total <= 9_999_999
        ? command(`submit ${total}`)
        : "";
    }
    case ModuleType.MARBLE_TUMBLE: {
      const timerDigits = arrayValue(raw.timerDigits);
      return timerDigits.length > 0 && timerDigits.every((digit) =>
        typeof digit === "number" && Number.isInteger(digit) && digit >= 0 && digit <= 9)
        ? commands(timerDigits.map(String))
        : "";
    }
    case ModuleType.YAHTZEE: {
      if (raw.action === "SOLVED") return command("done");
      if (raw.action === "ROLL_ALL") return command("roll");
      const keep = strings(raw.keepColors).map(words);
      return command(keep.length ? `keep ${keep.join(" ")}` : "reroll");
    }
    case ModuleType.X_RAY:
      return numberValue(raw.button) === undefined ? "" : command(`press ${raw.button}`);
    case ModuleType.BATTLESHIP: {
      const ships = strings(raw.shipLocations);
      return ships.length ? command(`torpedo ${ships.join(" ")}`) : "";
    }
    case ModuleType.MINESWEEPER: {
      const color = stringValue(raw.startingColor);
      const flags = strings(raw.mineCoordinates ?? raw.mines);
      return color ? command(`dig ${words(color)}`) : flags.length ? command(`flag ${flags.join(" ")}`) : "";
    }
    case ModuleType.WHOS_ON_FIRST:
    case ModuleType.THIRD_BASE:
      return command(stringValue(raw.buttonText) ?? stringValue(raw.button));
    case ModuleType.VENTING_GAS: {
      const answer = stringValue(raw.answer)?.toLowerCase();
      return answer === "yes" || answer === "no" ? command(answer) : "";
    }
    case ModuleType.CAPACITOR_DISCHARGE: {
      const seconds = numberValue(raw.holdSeconds);
      return seconds !== undefined && seconds > 0 ? command(`hold ${seconds}`) : "";
    }
    case ModuleType.COMPLICATED_WIRES: {
      const wire = numberValue(raw.wire) ?? numberValue(raw.wirePosition) ?? stringValue(raw.wire);
      return wire === undefined ? "" : command(`cut ${wire}`);
    }
    case ModuleType.WIRE_SEQUENCES: {
      const wire = numberValue(raw.wirePosition);
      return wire === undefined ? "" : command(`cut ${wire}`);
    }
    case ModuleType.PASSWORDS:
    case ModuleType.EXTENDED_PASSWORD: {
      const candidates = strings(raw.possibleWords);
      const password = stringValue(raw.password) ?? (candidates.length === 1 ? candidates[0] : undefined);
      return command(password);
    }
    case ModuleType.MAZES: {
      const map: Record<string, string> = { UP: "u", DOWN: "d", LEFT: "l", RIGHT: "r" };
      const directions = strings(raw.directions).map((direction) => map[direction] ?? direction.toLowerCase());
      return directions.length ? command(`move ${directions.join("")}`) : "";
    }
    case ModuleType.KNOBS: {
      const turns: Record<string, number> = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
      const position = stringValue(raw.position)?.toUpperCase();
      return position && turns[position] ? command(`rotate ${turns[position]}`) : "";
    }
    case ModuleType.COLOR_FLASH: {
      const position = numberValue(raw.position);
      const choice = booleanValue(raw.pressYes) ? "yes" : booleanValue(raw.pressNo) ? "no" : words(raw.action);
      return position === undefined || !choice ? "" : command(`press ${choice} ${position}`);
    }
    case ModuleType.COLOR_DECODING: {
      const selections = arrayValue(raw.selections).map(asRecord);
      if (!selections.length) return "";
      const presses = selections.map((selection) => {
        const type = stringValue(selection.type)?.toLowerCase();
        const index = numberValue(selection.index);
        return (type === "row" || type === "column") && Number.isInteger(index) && index! >= 1 && index! <= 6
          ? `${type === "column" ? "col" : "row"}${index}`
          : "";
      });
      return presses.every(Boolean) ? command(presses.join(" ")) : "";
    }
    case ModuleType.PIANO_KEYS:
    case ModuleType.CRUEL_PIANO_KEYS:
    case ModuleType.FESTIVE_PIANO_KEYS: {
      const notes = strings(raw.notes).map((note) => NOTE_NAMES[note] ?? note.replace("_SHARP", "#"));
      const joined = notes.length ? notes.join(" ") : stringValue(raw.notes)?.replaceAll("-", " ");
      return joined ? command(`press ${joined}`) : "";
    }
    case ModuleType.FLAGS: {
      const country = stringValue(raw.answerCountry);
      return country ? command(`submit ${words(country)}`) : "";
    }
    case ModuleType.TIMEZONE: {
      const submission = stringValue(raw.submission);
      return submission && /^\d{4}$/.test(submission) ? command(`submit ${submission}`) : "";
    }
    case ModuleType.POLYHEDRAL_MAZE: {
      const first = numberValue(raw.firstClockHour);
      const rest = arrayValue(raw.relativeDirections);
      if (first === undefined || !Number.isInteger(first) || first < 1 || first > 12 || !rest.length
        || rest.some((direction) => typeof direction !== "number" || !Number.isInteger(direction) || direction < 1 || direction > 12)) return "";
      return command(`move ${[first, ...rest].join(" ")}`);
    }
    case ModuleType.SYMBOLIC_COORDINATES: {
      const coordinate = stringValue(raw.coordinate)?.toUpperCase();
      return coordinate && /^[A-Z*][0-9*]$/.test(coordinate) ? command(`submit ${coordinate}`) : "";
    }
    case ModuleType.POETRY: {
      const word = strings(raw.correctWords)[0]?.trim().toLowerCase();
      return word && /^[a-z]+$/.test(word) ? command(`press ${word}`) : "";
    }
    case ModuleType.SONIC_THE_HEDGEHOG: {
      const button = stringValue(raw.button);
      return button && ["RBt", "In", "EL", "Rg"].includes(button) ? command(`press ${button}`) : "";
    }
    case ModuleType.SEMAPHORE: {
      const current = numberValue(raw.currentIndex);
      const target = numberValue(raw.targetIndex);
      if (current === undefined || target === undefined || current < 0 || target < 0) return "";
      const move = current < target ? "move right" : "move left";
      return commands([
        ...Array.from({ length: Math.abs(target - current) }, () => move),
        "press ok",
      ]);
    }
    case ModuleType.PERSPECTIVE_PEGS: {
      const aliases: Record<string, string> = { TOP: "t", "UPPER RIGHT": "tr", "LOWER RIGHT": "br", "LOWER LEFT": "bl", "UPPER LEFT": "tl" };
      const positions = strings(raw.pressPositions).map((position) => aliases[position.toUpperCase()] ?? position.toLowerCase());
      return positions.length ? command(`press ${positions.join(" ")}`) : "";
    }
    case ModuleType.EMOJI_MATH: {
      const answer = numberValue(raw.answer) ?? stringValue(raw.answer);
      return answer === undefined ? "" : command(`submit ${answer}`);
    }
    case ModuleType.SWITCHES: {
      const steps = arrayValue(raw.solutionSteps).map(Number).filter(Number.isFinite);
      return steps.length ? command(`flip ${steps.join(" ")}`) : "";
    }
    case ModuleType.COLORED_SWITCHES: {
      const steps = arrayValue(raw.solutionSteps).map(Number).filter((step) => Number.isInteger(step) && step >= 1 && step <= 5);
      return steps.length ? command(`toggle ${steps.join(" ")}`) : "";
    }
    case ModuleType.TWO_BITS: {
      const letters = stringValue(raw.letters)?.replace(/\s+/g, "").split("").join(" ");
      if (!letters) return "";
      const stageCount = arrayValue(raw.stages).length;
      return command(`press ${letters} ${stageCount >= 4 ? "submit" : "query"}`);
    }
    case ModuleType.WORD_SCRAMBLE: {
      const solution = stringValue(raw.solution);
      return solution ? command(`submit ${solution}`) : "";
    }
    case ModuleType.FONT_SELECT: {
      const actions = strings(raw.actions);
      return actions.length > 0 && actions.every((action) => ["left", "right", "submit"].includes(action))
        ? commands(actions)
        : "";
    }
    case ModuleType.JEWEL_VAULT: {
      const actions = strings(raw.actions);
      return actions.length > 0 && actions.every((action) =>
        action === "reset" || action === "submit" || /^turn [1-4](?: [1-3])?$/.test(action))
        ? commands(actions)
        : "";
    }
    case ModuleType.WORD_SEARCH: {
      const start = stringValue(raw.start)?.toUpperCase();
      const end = stringValue(raw.end)?.toUpperCase();
      return start && end && /^[A-F][1-6]$/.test(start) && /^[A-F][1-6]$/.test(end)
        ? command(`select ${start} ${end}`)
        : "";
    }
    case ModuleType.BROKEN_BUTTONS:
      return raw.action === "SUBMIT"
        ? command(`submit ${words(raw.submitSide)}`)
        : numberValue(raw.column) !== undefined && numberValue(raw.row) !== undefined
          ? command(`press ${raw.column} ${raw.row}`) : "";
    case ModuleType.COMPLICATED_BUTTONS: {
      const order = arrayValue(raw.pressOrder).map(String);
      return order.length ? command(`press ${order.join(" ")}`) : "";
    }
    case ModuleType.ANAGRAMS: {
      const solution = strings(raw.possibleSolutions)[0];
      return solution ? command(`submit ${solution}`) : "";
    }
    case ModuleType.COMBINATION_LOCK: {
      const combination = arrayValue(raw.combination).length ? arrayValue(raw.combination) : [raw.firstNumber, raw.secondNumber, raw.thirdNumber];
      return combination.every((value) => typeof value === "number") ? command(`submit ${combination.join(" ")}`) : "";
    }
    case ModuleType.LISTENING: {
      const code = stringValue(raw.code);
      return code ? command(`press ${code.replace(/\s+/g, " ")}`) : "";
    }
    case ModuleType.FOREIGN_EXCHANGE_RATES: {
      const key = numberValue(raw.keyPosition);
      return key === undefined ? "" : command(`press ${key === 0 ? 1 : key}`);
    }
    case ModuleType.ROUND_KEYPAD: {
      const positions = arrayValue(raw.positions).map(Number).filter(Number.isFinite);
      return positions.length ? command(`press ${positions.join(" ")}`) : "";
    }
    case ModuleType.COMPLEX_KEYPAD: {
      const positions = arrayValue(raw.pressPositions).map(Number);
      return positions.length === 9
        && new Set(positions).size === 9
        && positions.every((position) => Number.isInteger(position) && position >= 1 && position <= 9)
        ? command(`press ${positions.join(" ")}`)
        : "";
    }
    case ModuleType.NUMBER_PAD: {
      const code = stringValue(raw.code);
      return code ? command(`submit ${code}`) : "";
    }
    case ModuleType.ORIENTATION_CUBE: {
      const aliases: Record<string, string> = { ROTATE_LEFT: "l", ROTATE_RIGHT: "r", ROTATE_CLOCKWISE: "cw", ROTATE_COUNTERCLOCKWISE: "ccw" };
      const rotations = strings(raw.rotations).map((rotation) => aliases[rotation] ?? rotation.toLowerCase());
      return command(`press ${[...rotations, "set"].join(" ")}`);
    }
    case ModuleType.MORSEMATICS: {
      const letter = stringValue(raw.letter)?.toUpperCase();
      return letter && MORSE[letter] ? command(`submit ${MORSE[letter]}`) : "";
    }
    case ModuleType.CONNECTION_CHECK: {
      const states = Array.isArray(raw.ledStates)
        ? arrayValue(raw.ledStates)
        : [raw.led1, raw.led2, raw.led3, raw.led4];
      return states.every((state) => typeof state === "boolean") ? command(`submit ${states.map((state) => state ? "green" : "red").join(" ")}`) : "";
    }
    case ModuleType.LETTER_KEYS: {
      const letter = stringValue(raw.letter);
      return letter ? command(`press ${letter}`) : "";
    }
    case ModuleType.LOGIC: {
      const answers = arrayValue(raw.answers);
      return answers.every((answer) => typeof answer === "boolean") && answers.length ? command(`submit ${answers.map(String).join(" ")}`) : "";
    }
    case ModuleType.SUPERLOGIC: {
      const values = arrayValue(raw.values);
      return values.length === 3 && values.every((value) => typeof value === "boolean")
        ? command(`submit ${values.map((value) => value ? "t" : "f").join(" ")}`)
        : "";
    }
    case ModuleType.LOGIC_GATES: {
      const ready = booleanValue(raw.readyToCheck);
      return ready === undefined ? "" : command(ready ? "check" : "next");
    }
    case ModuleType.ASTROLOGY: {
      const score = numberValue(raw.omenScore);
      if (score === undefined) return "";
      return score === 0 ? command("press no") : command(`press ${score > 0 ? "good" : "bad"} on ${Math.abs(score)}`);
    }
    case ModuleType.MYSTIC_SQUARE: {
      const sequence = arrayValue(raw.targetConstellation).filter((value): value is number => typeof value === "number");
      return sequence.length ? command(`press ${sequence.join(" ")}`) : "";
    }
    case ModuleType.CRAZY_TALK: {
      const down = numberValue(raw.downAt);
      const up = numberValue(raw.upAt);
      return down === undefined || up === undefined ? "" : command(`toggle ${down} ${up}`);
    }
    case ModuleType.ADVENTURE_GAME: {
      const items = strings(raw.itemsToUse);
      const weapon = stringValue(raw.weaponToUse);
      const uses = [...items, ...(weapon ? [weapon] : [])];
      return uses.length ? command(`use ${uses.map(words).join(", ")}`) : "";
    }
    case ModuleType.PLUMBING: {
      if (!booleanValue(raw.submit)) return "";
      const rotations = strings(raw.rotations).map((coordinate) => coordinate.toUpperCase());
      if (!rotations.every((coordinate) => /^[A-F][1-6]$/.test(coordinate))) return "";
      return commands([rotations.length ? `rotate ${rotations.join(" ")}` : undefined, "submit"]);
    }
    case ModuleType.SAFETY_SAFE: {
      const turns = arrayValue(raw.dialTurns).map(Number).filter(Number.isFinite);
      return turns.length ? command(`submit ${turns.join(" ")}`) : "";
    }
    case ModuleType.CRYPTOGRAPHY: {
      const keys = strings(raw.keyOrder);
      return keys.length ? command(`press ${keys.join(" ")}`) : "";
    }
    case ModuleType.CAESAR_CIPHER: {
      const solution = stringValue(raw.solution);
      return solution ? command(`press ${solution.split("").join(" ")}`) : "";
    }
    case ModuleType.MODERN_CIPHER: {
      const solution = stringValue(raw.solution);
      return solution && /^[A-Z]{4,8}$/.test(solution) ? command(`submit ${solution.toLowerCase()}`) : "";
    }
    case ModuleType.PLAYFAIR_CIPHER: {
      const presses = stringValue(raw.pressSequence);
      return presses && /^[A-D]{4}$/.test(presses) && new Set(presses).size === 4
        ? command(`press ${presses.toLowerCase().split("").join(" ")}`) : "";
    }
    case ModuleType.TURN_THE_KEY: {
      const seconds = numberValue(raw.turnWhenSeconds);
      return seconds === undefined ? "" : command(`turn ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);
    }
    case ModuleType.TURN_THE_KEYS:
      if (booleanValue(raw.canTurnRightKey) && !booleanValue(raw.rightKeyTurned)) return command("turn right");
      if (booleanValue(raw.canTurnLeftKey) && !booleanValue(raw.leftKeyTurned)) return command("turn left");
      return "";
    case ModuleType.CHESS: {
      const coordinate = stringValue(raw.coordinate);
      return coordinate ? command(`press ${coordinate}`) : "";
    }
    case ModuleType.MOUSE_IN_THE_MAZE: {
      const aliases: Record<string, string> = { FORWARD: "f", BACKWARD: "b", TURN_LEFT: "l", TURN_RIGHT: "r" };
      const moves = strings(raw.moves).map((move) => aliases[move] ?? move.toLowerCase());
      return moves.length ? commands([moves.join(" "), "submit"]) : "";
    }
    case ModuleType.MORSE_A_MAZE: {
      const aliases: Record<string, string> = { UP: "U", DOWN: "D", LEFT: "L", RIGHT: "R" };
      const moves = strings(raw.moves).map((move) => aliases[move] ?? move.toUpperCase());
      return moves.length ? command(`move ${moves.join("")}`) : "";
    }
    case ModuleType.HEXAMAZE: {
      const moves = strings(raw.moves).map(words);
      return moves.length ? command(moves.join(" ")) : "";
    }
    case ModuleType.BLIND_MAZE: {
      const aliases: Record<string, string> = { NORTH: "n", EAST: "e", SOUTH: "s", WEST: "w" };
      const moves = strings(raw.moves).map((move) => aliases[move]);
      return moves.length && moves.every(Boolean) ? command(`move ${moves.join("")}`) : "";
    }
    case ModuleType.BITMAPS: {
      const button = numberValue(raw.button) ?? numberValue(raw.buttonNumber) ?? numberValue(raw.answer);
      return button === undefined ? "" : command(`press ${button}`);
    }
    case ModuleType.BRAILLE: {
      const position = numberValue(raw.pressPosition);
      return position !== undefined && position >= 1 && position <= 4 ? command(`press ${position}`) : "";
    }
    case ModuleType.COLORED_SQUARES: {
      const coordinates = strings(raw.coordinates).map((coordinate) => coordinate.toUpperCase());
      return coordinates.length && coordinates.every((coordinate) => /^[A-D][1-4]$/.test(coordinate))
        ? command(coordinates.join(" "))
        : "";
    }
    case ModuleType.ADJACENT_LETTERS: {
      const letters = strings(raw.pressLetters);
      return command(letters.length ? `submit ${letters.join(" ")}` : "submit!");
    }
    case ModuleType.SILLY_SLOTS:
      return command(booleanValue(raw.legal) ? "keep" : "pull");
    case ModuleType.SKEWED_SLOTS: {
      const code = stringValue(raw.code);
      return code ? command(`submit ${code}`) : "";
    }
    case ModuleType.THREE_D_MAZE: {
      const aliases: Record<string, string> = { FORWARD: "F", TURN_LEFT: "L", TURN_RIGHT: "R" };
      const moves = strings(raw.moves).map((move) => aliases[move] ?? move.toUpperCase());
      return moves.length ? command(`move ${moves.join(" ")}`) : "";
    }
    case ModuleType.SIMON_STATES: {
      const color = stringValue(raw.press);
      return color ? command(`press ${words(color)}`) : "";
    }
    case ModuleType.SIMON_SCREAMS: {
      const presses = strings(raw.press);
      return presses.length ? command(`press ${presses.map(words).join(" ")}`) : "";
    }
    case ModuleType.SIMON_SINGS: {
      const presses = strings(raw.press);
      const key = /^(?:left|right) (?:C|C♯|D|D♯|E|F|F♯|G|G♯|A|A♯|B)$/;
      return presses.length >= 2 && presses.length <= 6 && presses.length % 2 === 0 && presses.every((press) => key.test(press))
        ? command(`play ${presses.map((press) => press.replaceAll("♯", "#")).join(" ")}`)
        : "";
    }
    case ModuleType.SIMON_SENDS: {
      const transmission = stringValue(raw.transmission);
      return transmission && /^[KBGCRMYW]+$/.test(transmission) ? command(`press ${transmission.toLowerCase()}`) : "";
    }
    case ModuleType.SIMON_SHRIEKS: {
      const presses = strings(raw.presses);
      return presses.length && presses.every((color) => /^(?:RED|YELLOW|GREEN|CYAN|BLUE|WHITE|MAGENTA)$/.test(color))
        ? command(`press ${presses.map(words).join(" ")}`)
        : "";
    }
    case ModuleType.MODULES_AGAINST_HUMANITY:
      return strings(raw.commands).length ? commands(strings(raw.commands)) : "";
    case ModuleType.LAUNDRY: {
      if (booleanValue(raw.bobShortcut)) return command("insert coin");
      const symbols = [
        LAUNDRY_WASH[String(raw.washingSymbol)], LAUNDRY_DRY[String(raw.dryingSymbol)],
        LAUNDRY_IRON[String(raw.ironingSymbol)], LAUNDRY_SPECIAL[String(raw.specialSymbol)],
      ];
      return symbols.every((symbol) => symbol !== undefined) ? commands([`set all ${symbols.join(" ")}`, "insert coin"]) : "";
    }
    case ModuleType.PROBING: {
      const red = numberValue(raw.redClipWire);
      const blue = numberValue(raw.blueClipWire);
      return red === undefined || blue === undefined ? "" : command(`connect ${red} ${blue}`);
    }
    case ModuleType.ALPHABET: {
      const order = strings(raw.pressOrder);
      return order.length ? command(`press ${order.join(" ")}`) : "";
    }
    case ModuleType.MICROCONTROLLER: {
      const colors = arrayValue(raw.pins)
        .map(asRecord)
        .map((pin) => stringValue(pin.color)?.toLowerCase())
        .filter((color): color is string => Boolean(color));
      return colors.length ? commands(colors.map((color) => `set ${color}`)) : "";
    }
    case ModuleType.MURDER: {
      const suspect = stringValue(raw.suspect);
      const weapon = stringValue(raw.weapon);
      const location = stringValue(raw.location);
      return suspect && weapon && location ? command(`it was ${words(suspect)}, with the ${words(weapon)}, in the ${words(location)}`) : "";
    }
    case ModuleType.SUBWAYS: {
      const time = stringValue(raw.time);
      const stops = strings(raw.stops);
      return time && /^(?:[1-9]|1[0-2]) (?:AM|PM)$/.test(time) && stops.length === 3
        ? command(`submit ${time.toLowerCase()}, ${stops.join(", ")}`)
        : "";
    }
    case ModuleType.DR_DOCTOR: {
      const diagnosis = stringValue(raw.diagnosis);
      const treatment = stringValue(raw.treatment);
      const dose = stringValue(raw.dose);
      const day = numberValue(raw.followUpDay);
      const month = numberValue(raw.followUpMonth);
      return diagnosis && treatment && dose && /^\d+m?g$/i.test(dose)
        && Number.isInteger(day) && day! >= 1 && day! <= 31
        && Number.isInteger(month) && month! >= 1 && month! <= 12
        ? command(`treat ${diagnosis},${treatment},${dose},${day},${month}`)
        : "";
    }
    case ModuleType.RESISTORS: {
      const tokens = resistorTokens(raw);
      return tokens.length ? commands([`connect ${tokens.join(" ")}`, "submit"]) : "";
    }
    case ModuleType.GAMEPAD: {
      const sequence = strings(raw.sequence);
      return sequence.length ? command(`submit ${sequence.join("").toLowerCase()}`) : "";
    }
    case ModuleType.TIC_TAC_TOE:
      return raw.action === "PASS" ? command("pass") : numberValue(raw.number) === undefined ? "" : command(String(raw.number));
    case ModuleType.MONSPLODE_FIGHT: {
      const move = stringValue(raw.move);
      return move ? command(`use ${words(move)}`) : "";
    }
    case ModuleType.MONSPLODE_TRADING_CARDS: {
      if (raw.action === "KEEP") return command("keep");
      const selected = numberValue(raw.selectedCard);
      const target = numberValue(raw.tradeCard);
      if (raw.action !== "TRADE" || !Number.isInteger(selected) || !Number.isInteger(target)
        || selected! < 1 || selected! > 3 || target! < 1 || target! > 3) return "";
      const direction = target! > selected! ? "right" : "left";
      return commands([...Array(Math.abs(target! - selected!)).fill(direction), "trade"]);
    }
    case ModuleType.SHAPE_SHIFT: {
      const left = stringValue(raw.left);
      const right = stringValue(raw.right);
      return left && right ? command(`submit ${words(left)} ${words(right)}`) : "";
    }
    case ModuleType.FOLLOW_THE_LEADER: {
      const plugs = arrayValue(raw.cutPlugs).map(String);
      return plugs.length ? command(`cut ${plugs.join(" ")}`) : "";
    }
    case ModuleType.FRIENDSHIP: {
      const element = stringValue(raw.element);
      return element ? command(`submit ${element}`) : "";
    }
    case ModuleType.THE_BULB: {
      const start = numberValue(raw.continueFrom) ?? 0;
      const actions = strings(raw.actions).slice(start).map(bulbAction);
      return actions.length && actions.every(Boolean) ? command(actions.join(", ")) : "";
    }
    case ModuleType.BLIND_ALLEY: {
      const regions = strings(raw.regions);
      return regions.length ? command(regions.join(" ")) : "";
    }
    case ModuleType.SEA_SHELLS: {
      const order = strings(raw.pressOrder);
      return order.length ? command(`label ${order.join(" ")}`) : "";
    }
    case ModuleType.ENGLISH_TEST: {
      const position = numberValue(raw.answerPosition);
      return position !== undefined && Number.isInteger(position) && position >= 1 && position <= 4
        ? command(`submit ${position}`)
        : "";
    }
    case ModuleType.ROCK_PAPER_SCISSORS_LIZARD_SPOCK: {
      const signs = strings(raw.signsToPress);
      return signs.length ? command(`press ${signs.map(words).join(" ")}`) : "";
    }
    case ModuleType.SQUARE_BUTTON:
      if (booleanValue(raw.hold)) return command("hold");
      return stringValue(raw.instruction) === "Press and immediately release" ? command("tap") : "";
    case ModuleType.TEXT_FIELD: {
      const positions = arrayValue(raw.positions).map(asRecord).map((position) => `${position.column},${position.row}`);
      return positions.length ? command(`press ${positions.join(" ")}`) : "";
    }
    case ModuleType.SYMBOLIC_PASSWORD: {
      const aliases: Record<string, string> = {
        LEFT_COLUMN: "l", MIDDLE_COLUMN: "m", RIGHT_COLUMN: "r",
        TOP_LEFT: "tl", TOP_RIGHT: "tr", BOTTOM_LEFT: "bl", BOTTOM_RIGHT: "br",
      };
      const moves = strings(raw.moves).map((move) => aliases[move] ?? move.toLowerCase());
      return moves.length ? commands([`cycle ${moves.join(" ")}`, "submit"]) : "";
    }
    case ModuleType.WIRE_PLACEMENT: {
      const coordinates = arrayValue(raw.cutWires).map(asRecord).map((wire) => stringValue(wire.coordinate)).filter((value): value is string => Boolean(value));
      return coordinates.length ? command(`cut ${coordinates.join(" ")}`) : "";
    }
    case ModuleType.PERPLEXING_WIRES: {
      const cuts = [...arrayValue(raw.cutFirst), ...arrayValue(raw.cutNormal), ...arrayValue(raw.cutLast)].map(Number);
      return cuts.length && cuts.every((wire) => Number.isInteger(wire) && wire >= 1 && wire <= 6)
        ? command(`cut ${cuts.join(" ")}`)
        : "";
    }
    case ModuleType.DOUBLE_OH: {
      const aliases: Record<string, string> = { SINGLE_VERTICAL: "vert1", SINGLE_HORIZONTAL: "horiz1", DOUBLE_HORIZONTAL: "horiz2", DOUBLE_VERTICAL: "vert2", SQUARE: "submit" };
      const presses = strings(raw.presses).map((press) => aliases[press] ?? press.toLowerCase());
      return presses.length ? command(presses.join(" ")) : "";
    }
    case ModuleType.CHEAP_CHECKOUT:
      return booleanValue(raw.needsSecondPayment) ? command("submit") : numberValue(raw.change) === undefined ? "" : command(`submit ${numberValue(raw.change)?.toFixed(2)}`);
    case ModuleType.COORDINATES: {
      const clues = strings(raw.matchingClues);
      return clues.length ? commands(clues.map((clue) => `submit ${clue.replace(/\s+/g, " ")}`)) : "";
    }
    case ModuleType.LIGHT_CYCLE: {
      const codes: Record<string, string> = { RED: "R", YELLOW: "Y", GREEN: "G", BLUE: "B", MAGENTA: "M", WHITE: "W" };
      const sequence = strings(raw.sequence).map((color) => codes[color] ?? color);
      return sequence.length ? command(sequence.join(" ")) : "";
    }
    case ModuleType.SYMBOL_CYCLE: {
      if (raw.mode === "RETROTRANSPHASIC") {
        const left = numberValue(raw.leftClicks);
        const right = numberValue(raw.rightClicks);
        if (left === undefined || right === undefined || !Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0) return "";
        return commands([left ? `click left ${left}` : undefined, right ? `click right ${right}` : undefined, "flip"]);
      }
      if (raw.mode === "ANTERODIAMETRIC") {
        const screen = stringValue(raw.clickScreen)?.toLowerCase();
        const clicks = numberValue(raw.clicks);
        if ((screen !== "left" && screen !== "right") || clicks === undefined || !Number.isInteger(clicks) || clicks < 0) return "";
        return commands([clicks ? `click ${screen} ${clicks}` : undefined, "flip"]);
      }
      return "";
    }
    case ModuleType.BINARY_LEDS: {
      const color = stringValue(raw.recommendedColor);
      const value = numberValue(raw.recommendedValue);
      return color && value !== undefined ? command(`cut ${words(color)} ${value}`) : "";
    }
    case ModuleType.RHYTHMS: {
      if (booleanValue(raw.mash)) return command("mash");
      const actions = arrayValue(raw.actions).map(asRecord);
      return actions.length ? commands(actions.map((action) => {
        const button = stringValue(action.button);
        const beeps = numberValue(action.beeps);
        return button && beeps !== undefined ? `press ${words(button)} ${beeps}` : undefined;
      })) : "";
    }
    case ModuleType.JUKEBOX: {
      const positions = arrayValue(raw.pressPositions);
      return positions.length === 3
        && new Set(positions).size === 3
        && positions.every((position) => typeof position === "number" && Number.isInteger(position) && position >= 1 && position <= 3)
        ? command(`press ${positions.join("")}`)
        : "";
    }
    case ModuleType.COLOR_MATH: {
      const codes: Record<string, string> = { BLUE: "b", GREEN: "g", PURPLE: "p", YELLOW: "y", WHITE: "w", MAGENTA: "m", RED: "r", ORANGE: "o", GRAY: "a", BLACK: "k" };
      const colors = strings(raw.colors).map((color) => codes[color] ?? color.toLowerCase());
      return colors.length ? commands([`set ${colors.join(",")}`, "submit"]) : "";
    }
    case ModuleType.COLOR_MORSE: {
      const morse = strings(raw.morse);
      return morse.length ? command(`transmit ${morse.join(" ")}`) : "";
    }
    case ModuleType.COLOR_GENERATOR: {
      const values = [raw.red, raw.green, raw.blue];
      return values.every((value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 255)
        ? command(`submit ${values.join(" ")}`)
        : "";
    }
    case ModuleType.BIG_CIRCLE: {
      const colors = strings(raw.pressSequence);
      return colors.length === 3 ? command(`press ${colors.map(words).join(" ")}`) : "";
    }
    case ModuleType.MASTERMIND_SIMPLE:
    case ModuleType.MASTERMIND_CRUEL: {
      const codes: Record<string, string> = { WHITE: "w", MAGENTA: "m", YELLOW: "y", GREEN: "g", RED: "r", BLUE: "b" };
      const colors = strings(raw.nextGuess).map((color) => codes[color]);
      return colors.length === 5 && colors.every(Boolean)
        ? command(`${booleanValue(raw.submit) ? "submit" : "query"} ${colors.join(" ")}`)
        : "";
    }
    case ModuleType.GRIDLOCK: {
      const coordinate = stringValue(raw.coordinate)?.toUpperCase();
      return coordinate && /^[A-D][1-4]$/.test(coordinate) ? command(`press ${coordinate}`) : "";
    }
    case ModuleType.GAME_OF_LIFE_SIMPLE:
    case ModuleType.GAME_OF_LIFE_CRUEL: {
      if (moduleType === ModuleType.GAME_OF_LIFE_CRUEL && booleanValue(raw.submitInitial)) return command("submit");
      const cells = arrayValue(raw.whiteCells);
      if (cells.length !== 48 || cells.some((cell) => typeof cell !== "boolean")) return "";
      const coordinates = cells.flatMap((white, index) => white
        ? [`${String.fromCharCode(65 + index % 6)}${Math.floor(index / 6) + 1}`]
        : []);
      return command(["clear", ...coordinates, "submit"].join(" "));
    }
    case ModuleType.LEGOS:
      return "";
    case ModuleType.ONLY_CONNECT: {
      const position = numberValue(raw.position);
      if (position !== undefined) return command(`press ${position}`);
      const groups = arrayValue(raw.groups).map(asRecord).map((group) => strings(group.letters));
      return groups.length ? commands(groups.slice(0, 2).map((letters) => `press ${letters.join(" ")}`)) : "";
    }
    case ModuleType.NEUTRALIZATION: {
      const base = stringValue(raw.baseFormula);
      const drops = numberValue(raw.drops);
      if (!base || drops === undefined) return "";
      return commands([base === "NH3" ? undefined : `base ${base}`, `conc set ${drops}`, booleanValue(raw.filterOn) ? "filter" : undefined, "titrate"]);
    }
    case ModuleType.WEB_DESIGN: {
      const aliases: Record<string, string> = { ACCEPT: "acc", CONSIDER: "con", REJECT: "rej" };
      return aliases[String(raw.answer)] ? command(aliases[String(raw.answer)]) : "";
    }
    case ModuleType.CHORD_QUALITIES: {
      const notes = strings(raw.answerNotes).map((note) => note.replace("♯", "#"));
      return notes.length ? command(`submit ${notes.join(" ")}`) : "";
    }
    case ModuleType.CREATION: {
      const first = stringValue(raw.first);
      const second = stringValue(raw.second);
      return first && second ? command(`combine ${words(first)} ${words(second)}`) : "";
    }
    case ModuleType.RUBIKS_CUBE: {
      const moves = strings(raw.moves);
      return moves.length ? command(moves.join(" ")) : "";
    }
    case ModuleType.RUBIKS_CLOCK: {
      const pins = strings(raw.pins).map(words);
      const gear = stringValue(raw.gear)?.toLowerCase();
      const hours = numberValue(raw.hours);
      return pins.length === 2 && pins.every((pin) => /^(tl|tr|bl|br)$/.test(pin))
        && gear && /^(tl|tr|bl|br)$/.test(gear) && hours !== undefined && Number.isInteger(hours) && hours !== 0
        ? command([...pins, gear, String(hours), "t"].join(" "))
        : "";
    }
    case ModuleType.FIZZ_BUZZ: {
      const actions = strings(raw.actions);
      return actions.length ? command(`submit ${actions.map(words).join(" ")}`) : "";
    }
    case ModuleType.THE_CLOCK: {
      const target = stringValue(raw.targetTime);
      return target ? command(`set ${target.toLowerCase()}`) : "";
    }
    case ModuleType.THE_STOPWATCH: {
      const runtime = numberValue(raw.runtimeSeconds);
      return runtime !== undefined && Number.isInteger(runtime) && runtime >= 0 && runtime <= 59
        ? command(`stop at ${runtime}`)
        : "";
    }
    case ModuleType.PIE: {
      const order = arrayValue(raw.pressOrder).filter((position): position is number => typeof position === "number");
      return order.length === 5 && new Set(order).size === 5 && order.every((position) => position >= 1 && position <= 5)
        ? command(`press ${order.join(" ")}`)
        : "";
    }
    case ModuleType.THE_WIRE: {
      const dials = [stringValue(raw.dial1), stringValue(raw.dial2), stringValue(raw.dial3)];
      const second = numberValue(raw.cutSecond);
      return dials.every((dial) => /^[A-Z]$/.test(dial ?? "")) && second !== undefined
        && Number.isInteger(second) && second >= 0 && second <= 9
        ? commands([`set 1 ${dials[0]} 2 ${dials[1]} 3 ${dials[2]}`, `cut at ${second}`])
        : "";
    }
    case ModuleType.LED_ENCRYPTION: {
      const letter = strings(raw.correctLetters)[0] ?? stringValue(raw.letter);
      return letter ? command(`press ${letter}`) : "";
    }
    case ModuleType.LOGICAL_BUTTONS: {
      const rawButtons = arrayValue(raw.pressButtons);
      const buttons = rawButtons.filter((button): button is number => typeof button === "number");
      const pressOperator = booleanValue(raw.pressOperator);
      if (pressOperator === true) return buttons.length === 0 ? command("press operator") : "";
      return pressOperator === false && buttons.length === rawButtons.length
        && buttons.length >= 1 && buttons.length <= 3 && new Set(buttons).size === buttons.length
        && buttons.every((button) => Number.isInteger(button) && button >= 1 && button <= 3)
        ? command(`press ${buttons.join(" ")}`)
        : "";
    }
    case ModuleType.LED_GRID: {
      const buttons = strings(raw.pressOrder);
      return buttons.length === 4 && new Set(buttons).size === 4 && buttons.every((button) => /^[A-D]$/.test(button))
        ? command(`press ${buttons.join("").toLowerCase()}`)
        : "";
    }
    case ModuleType.GRAFFITI_NUMBERS: {
      const positions = arrayValue(raw.buttonPositions).map(Number);
      return positions.length > 0 && positions.length <= 9 && new Set(positions).size === positions.length
        && positions.every((position) => Number.isInteger(position) && position >= 1 && position <= 9)
        ? command(`spray ${positions.join(" ")}`)
        : "";
    }
    case ModuleType.X01: {
      const darts = strings(raw.darts);
      const segment = /^(?:(?:IN|OUT|D|T)(?:[1-9]|1\d|20)|[SD]B)$/;
      return darts.length >= 2 && darts.length <= 4 && new Set(darts).size === darts.length
        && darts.every((dart) => segment.test(dart)) && /^(?:D(?:[1-9]|1\d|20)|DB)$/.test(darts.at(-1) ?? "")
        ? command(`throw ${darts.join(" ")}`)
        : "";
    }
    case ModuleType.THE_MOON:
    case ModuleType.THE_SUN: {
      const presses = strings(raw.pressSequence);
      const valid = /^(?:(?:inner|outer) (?:north|northeast|east|southeast|south|southwest|west|northwest)|center)$/;
      return presses.length > 0
        && (presses.length === 8 || presses.at(-1) === "center")
        && new Set(presses).size === presses.length
        && presses.every((press) => valid.test(press))
        ? command(`press ${presses.join(";")}`)
        : "";
    }
    case ModuleType.GRID_MATCHING: {
      const actions = strings(raw.actions);
      const letter = stringValue(raw.letter);
      const validActions = new Set(["up", "down", "left", "right", "clockwise", "counter-clockwise"]);
      return /^[A-P]$/.test(letter ?? "") && actions.every((action) => validActions.has(action))
        ? command([...actions, "set", (letter ?? "").toLowerCase(), "submit"].join(" "))
        : "";
    }
    case ModuleType.LASERS: {
      const positions = arrayValue(raw.positions).map(Number);
      return positions.length === 7 && new Set(positions).size === 7
        && positions.every((position) => Number.isInteger(position) && position >= 1 && position <= 9)
        ? command(`position ${positions.join("")}`)
        : "";
    }
    case ModuleType.TURTLE_ROBOT: {
      const bugLines = arrayValue(raw.bugLines).map(Number).sort((a, b) => a - b);
      if (bugLines.length !== 3 || new Set(bugLines).size !== 3
        || bugLines.some((line) => !Number.isInteger(line) || line < 1 || line > 22)) return "";
      const steps: string[] = [];
      let currentLine = 1;
      for (const bugLine of bugLines) {
        if (bugLine > currentLine) steps.push(`down ${bugLine - currentLine}`);
        steps.push("comment");
        currentLine = bugLine;
      }
      return commands(steps);
    }
    case ModuleType.GUITAR_CHORDS: {
      const frets = arrayValue(raw.frets).map(String);
      return frets.length === 6 && frets.every((fret) => fret === "-" || /^(?:[0-9]|1[0-2])$/.test(fret))
        ? command(`play ${frets.join(",")}`)
        : "";
    }
    case ModuleType.CALENDAR: {
      const targetMonth = Number(raw.targetMonth);
      const targetDay = Number(raw.targetDay);
      const pressCount = Number(raw.pressCount);
      const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      if (!Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12
        || !Number.isInteger(targetDay) || targetDay < 1 || targetDay > 31
        || ![1, 3].includes(pressCount)) return "";
      return commands([
        ...(targetMonth === 1 ? [] : [months[targetMonth - 1]]),
        ...Array<string>(pressCount).fill(`press ${targetDay}`),
      ]);
    }
    case ModuleType.USA_MAZE: {
      const shapeDigits: Record<string, string> = {
        CIRCLE: "0", SQUARE: "1", DIAMOND: "2", TRAPEZOID: "3",
        PARALLELOGRAM: "4", TRIANGLE: "5", HEART: "6", STAR: "7",
      };
      const presses = arrayValue(raw.presses).map((shape) => shapeDigits[String(shape).toUpperCase()]);
      return presses.length > 0 && presses.every(Boolean) ? command(`press ${presses.join("")}`) : "";
    }
    case ModuleType.BINARY_TREE: {
      const presses = arrayValue(raw.presses).map(Number);
      return presses.length > 0 && presses.every((press) => Number.isInteger(press) && press >= 1 && press <= 7)
        ? commands(presses.map((press) => `press ${press}`))
        : "";
    }
    case ModuleType.THE_TIME_KEEPER: {
      const led = Number(raw.correctLed);
      let target = Number(raw.finalNumber);
      if (!Number.isInteger(led) || led < 1 || led > 3 || !Number.isInteger(target) || target <= 0) return "";
      while (target <= 10) target *= 2;
      while (target > 59999) target = Math.floor(target / 2);
      return command(`press ${led} at ${Math.floor(target / 60)}:${String(target % 60).padStart(2, "0")}`);
    }
    case ModuleType.LIGHTSPEED: {
      const warp = Number(raw.warpSpeed);
      const planet = String(raw.planet ?? "").trim().toLowerCase().replaceAll("’", "'");
      const officer = String(raw.officer ?? "").split(",")[0].trim().toLowerCase();
      const encryption = String(raw.encryptionCode ?? "");
      if (!Number.isInteger(warp) || warp < 1 || warp > 9 || !planet || !officer || !/^\d{4}$/.test(encryption)) return "";
      return commands([
        `set warp ${warp}`,
        `set planet ${planet}`,
        `set officer ${officer}`,
        `set encryption ${encryption}`,
        "engage",
      ]);
    }
    case ModuleType.BLACK_HOLE: {
      const gestures: Record<string, string> = {
        "0": "hold tick release",
        "1": "tap tick tap",
        "2": "tap tick hold tick release",
        "3": "hold tick release hold tick release",
        "4": "hold tick tick release",
        C: "tap tap",
      };
      const gesture = gestures[String(raw.digit)];
      return gesture ? command(gesture) : "";
    }
    case ModuleType.SIMONS_STAR: {
      const colors = arrayValue(raw.presses).map((color) => String(color).toLowerCase());
      return colors.length > 0 && colors.length <= 5
        && colors.every((color) => ["red", "green", "blue", "yellow", "purple"].includes(color))
        ? command(`press ${colors.join(" ")}`)
        : "";
    }
    case ModuleType.MORSE_WAR: {
      const presses = arrayValue(raw.presses).map(String);
      return presses.length === 4 && presses.every((press) => /^[SU]$/i.test(press))
        ? command(`press ${presses.join("").toUpperCase()}`)
        : "";
    }
    case ModuleType.THE_STOCK_MARKET: {
      const winner = strings(raw.companies)[0];
      const initial = winner?.charAt(0).toUpperCase();
      return initial && /^[ACGHIMNQRSTV]$/.test(initial) ? command(`submit ${initial}`) : "";
    }
    case ModuleType.MINESEEKER: {
      const moves = strings(raw.moves).map((move) => move.toUpperCase());
      return moves.every((move) => /^[URDL]$/.test(move)) && stringValue(raw.destinationImage)
        ? command(`${moves.join("").toLowerCase()}${moves.length ? " " : ""}submit`)
        : "";
    }
    case ModuleType.MAZE_SCRAMBLER: {
      const colorLetters: Record<string, string> = { RED: "r", BLUE: "b", GREEN: "g", YELLOW: "y" };
      const presses = strings(raw.presses).map((press) => colorLetters[press.toUpperCase()]);
      return presses.length && presses.every(Boolean) ? commands(["reset", `press ${presses.join("")}`]) : "";
    }
    case ModuleType.THE_NUMBER_CIPHER: {
      const answer = numberValue(raw.answer);
      return answer !== undefined && Number.isInteger(answer) && answer >= 0 && answer <= 9
        ? command(`submit ${answer}`) : "";
    }
    case ModuleType.ALPHABET_NUMBERS: {
      const presses = arrayValue(raw.presses).map(Number);
      return presses.length === 6 && new Set(presses).size === 6
        && presses.every((press) => Number.isInteger(press) && press >= 1 && press <= 6)
        ? command(`press ${presses.join(" ")}`) : "";
    }
    case ModuleType.BRITISH_SLANG: {
      const position = numberValue(raw.pressPosition);
      return position !== undefined && Number.isInteger(position) && position >= 1 && position <= 4
        ? command(`press ${position}`) : "";
    }
    case ModuleType.DOUBLE_COLOR: {
      const digit = numberValue(raw.digit);
      return digit !== undefined && Number.isInteger(digit) && digit >= 0 && digit <= 9
        ? command(`submit at ${digit}`) : "";
    }
    case ModuleType.MARITIME_FLAGS: {
      const direction = stringValue(raw.direction)?.toUpperCase();
      return direction && ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"].includes(direction)
        ? command(direction) : "";
    }
    case ModuleType.EQUATIONS: {
      if (booleanValue(raw.blank)) return command("submit");
      const answer = stringValue(raw.answer);
      return answer && /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(answer) ? command(`submit ${answer}`) : "";
    }
    case ModuleType.DETERMINANTS: {
      const determinant = numberValue(raw.determinant);
      return determinant !== undefined && Number.isInteger(determinant) && determinant >= -162 && determinant <= 162
        ? command(`submit ${determinant}`) : "";
    }
    case ModuleType.PATTERN_CUBE: {
      const placements = arrayValue(raw.placements).map(asRecord);
      if (placements.length !== 5) return "";
      const steps: string[] = [];
      for (const placement of placements) {
        const selection = numberValue(placement.selection);
        const letter = stringValue(placement.targetLetter)?.toUpperCase();
        const rotation = stringValue(placement.rotation)?.toLowerCase();
        if (selection === undefined || !Number.isInteger(selection) || selection < 1 || selection > 5
          || !letter?.match(/^[A-TV-Z]$/) || !["none", "cw", "ccw", "180"].includes(rotation ?? "")) return "";
        if (rotation !== "none") steps.push(`${selection} ${rotation}`);
        steps.push(`${selection} ${letter}`);
      }
      return command(steps.join(" "));
    }
    case ModuleType.KNOW_YOUR_WAY: {
      const presses = arrayValue(raw.presses).map(String);
      return presses.length === 4 && presses.every((press) => /^[ULDR]$/i.test(press))
        ? command(`press ${presses.join("").toUpperCase()}`) : "";
    }
    case ModuleType.SPLITTING_THE_LOOT: {
      const colors = arrayValue(raw.colors).map((color) => String(color).toUpperCase());
      const locked = numberValue(raw.coloredBag);
      if (colors.length !== 7 || !colors.every((color) => ["RED", "BLUE", "NORMAL"].includes(color))
        || locked === undefined || !Number.isInteger(locked) || locked < 1 || locked > 7) return "";
      return commands(["RED", "BLUE", "NORMAL"].map((color) => {
        const bags = colors.flatMap((bagColor, index) => bagColor === color && index + 1 !== locked ? [index + 1] : []);
        return bags.length ? `set bag ${bags.join(" ")} ${color.toLowerCase()}` : undefined;
      }).concat("split"));
    }
    case ModuleType.CHARACTER_SHIFT: {
      const solution = asRecord(arrayValue(raw.solutions)[0]);
      const letter = stringValue(solution.letter)?.toUpperCase();
      const digit = numberValue(solution.digit);
      return letter && /^[A-Z]$/.test(letter) && digit !== undefined && Number.isInteger(digit) && digit >= 0 && digit <= 9
        ? command(`submit ${letter}${digit}`) : "";
    }
    case ModuleType.SIMON_SAMPLES: {
      const presses = arrayValue(raw.presses).map(Number);
      return presses.length >= 4 && presses.length <= 12 && presses.every((press) => Number.isInteger(press) && press >= 1 && press <= 4)
        ? commands(["record", presses.join(" ")]) : "";
    }
    case ModuleType.DRAGON_ENERGY: {
      const word = strings(raw.acceptableWords)[0]?.toLowerCase();
      const digit = arrayValue(raw.safeTimerDigits).map(Number)[0];
      return word && /^[a-z]+$/.test(word) && digit !== undefined && Number.isInteger(digit) && digit >= 0 && digit <= 9
        ? command(`${word} ${digit}`) : "";
    }
    case ModuleType.UNCOLORED_SQUARES:
      return "";
    case ModuleType.FLASHING_LIGHTS: {
      const presses = arrayValue(raw.presses).map(Number);
      return presses.length === 2 && presses.every((press) => Number.isInteger(press) && press >= 1 && press <= 5)
        ? commands(presses.map((press) => `press ${press}`)) : "";
    }
    case ModuleType.THREE_D_TUNNELS: {
      const actions = strings(raw.actions);
      if (!actions.length || actions.some((action) => !["U", "D", "L", "R", "SUBMIT"].includes(action))) return "";
      const moves = actions.filter((action) => action !== "SUBMIT");
      return commands([moves.length ? `move ${moves.join(" ").toLowerCase()}` : undefined, actions.includes("SUBMIT") ? "submit" : undefined]);
    }
    case ModuleType.SYNCHRONIZATION: {
      const steps = arrayValue(raw.steps).map(asRecord);
      const timerDigit = numberValue(raw.timerDigit);
      if (steps.length !== 4 || timerDigit === undefined || !Number.isInteger(timerDigit) || timerDigit < 1 || timerDigit > 9) return "";
      const pairs = steps.map((step) => {
        const first = numberValue(step.firstPosition), second = numberValue(step.secondPosition);
        const firstState = stringValue(step.firstState)?.toLowerCase(), secondState = stringValue(step.secondState)?.toLowerCase();
        return first !== undefined && second !== undefined && first >= 1 && first <= 9 && second >= 1 && second <= 9
          && ["on", "off"].includes(firstState ?? "") && ["on", "off"].includes(secondState ?? "")
          ? `${first} ${firstState} ${second} ${secondState}` : undefined;
      });
      return pairs.every(Boolean) ? commands([...pairs, String(timerDigit)]) : "";
    }
    case ModuleType.THE_SWITCH: {
      const digit = numberValue(raw.timerDigit);
      return digit !== undefined && Number.isInteger(digit) && digit >= 0 && digit <= 9 ? command(`flip ${digit}`) : "";
    }
    case ModuleType.REVERSE_MORSE: {
      const first = strings(raw.firstTransmission), second = strings(raw.secondTransmission);
      const valid = (tokens: string[]) => tokens.length === 13 && tokens.every((token, index) =>
        index === 12 ? token === "tx" : index % 2 === 1 ? token === "br" : /^[.-]{1,5}$/.test(token));
      const stage = numberValue(raw.currentStage);
      if (!valid(first) || !valid(second) || (stage !== 1 && stage !== 2)) return "";
      return command((stage === 2 ? second : [...first, ...second]).join(" "));
    }
    case ModuleType.MANOMETERS: {
      const stage = numberValue(raw.stage), target = numberValue(raw.targetPressure);
      if (stage === 1) return target !== undefined && Number.isInteger(target) && target >= 10 && target <= 35 ? command(`submit ${target}`) : "";
      const top = numberValue(raw.topPressure), bottomLeft = numberValue(raw.bottomLeftPressure), bottomRight = numberValue(raw.bottomRightPressure);
      if (stage !== 2 || [top, bottomLeft, bottomRight].some((pressure) => pressure === undefined || !Number.isInteger(pressure) || pressure < 0 || pressure > 10)) return "";
      return commands([`t ${top} bl ${bottomLeft} br ${bottomRight}`, raw.useValve === true ? "valve" : undefined]);
    }
    case ModuleType.SHIKAKU: {
      const presses = strings(raw.presses);
      return presses.length >= 36 && presses.every((cell) => /^[A-F][1-6]$/.test(cell)) ? command(`press ${presses.join(" ").toLowerCase()}`) : "";
    }
    case ModuleType.WIRE_SPAGHETTI: {
      const aliases = strings(raw.aliases);
      return aliases.length && aliases.every((alias) => /^(?:p|l|dr|w|g|o|b|y|lr|k|dg|i|a|r|lg)$/.test(alias)) ? command(`cut ${aliases.join(" ")}`) : "";
    }
    case ModuleType.MODULE_HOMEWORK: {
      const button = numberValue(raw.button);
      return button !== undefined && Number.isInteger(button) && button >= 1 && button <= 4 ? commands(["start", `press ${button}`]) : "";
    }
    case ModuleType.TENNIS: {
      const actions = strings(raw.actions).map((action) => action.toLowerCase());
      return actions.length && actions.every((action) => /^(?:p[12]|r|lr|s1|s2|s|s[1-5][12])$/.test(action)) ? command(actions.join(" ")) : "";
    }
    case ModuleType.BENEDICT_CUMBERBATCH: {
      const left = stringValue(raw.leftSuffix)?.toLowerCase(), right = stringValue(raw.rightSuffix)?.toLowerCase();
      return left && right && /^[a-z']+$/.test(left) && /^[a-z']+$/.test(right) ? command(`submit ${left} ${right}`) : "";
    }
    case ModuleType.BOGGLE: {
      const plays = arrayValue(raw.plays).map(asRecord);
      const bodies = plays.map((play) => {
        const cells = strings(play.cells).map((cell) => cell.toLowerCase());
        return cells.length >= 3 && cells.every((cell) => /^[a-d][1-4]$/.test(cell)) ? `press ${cells.join(" ")}` : undefined;
      });
      return bodies.length && bodies.every(Boolean) ? commands(bodies) : "";
    }
    case ModuleType.HORRIBLE_MEMORY: {
      const position = numberValue(raw.position);
      return position !== undefined && Number.isInteger(position) && position >= 1 && position <= 6 ? command(`position ${position}`) : "";
    }
    case ModuleType.SIGNALS: {
      const clicks = strings(raw.clicks).map((click) => click.toLowerCase());
      return clicks.every((click) => /^s[123]$/.test(click)) ? commands([clicks.length ? clicks.join(" ") : undefined, "submit"]) : "";
    }
    case ModuleType.BOOLEAN_MAZE: {
      const action = stringValue(raw.action)?.toLowerCase();
      return action && /^(?:u|d|l|r|stuck|reset)$/.test(action) ? command(`press ${action}`) : "";
    }
    case ModuleType.SONIC_KNUCKLES: {
      const object = stringValue(raw.object)?.toLowerCase(), second = numberValue(raw.ringSecond), hits = numberValue(raw.hitsRequired), first = stringValue(raw.firstHitParity)?.toLowerCase(), last = stringValue(raw.finalHitParity)?.toLowerCase();
      if (!object || !/^(?:hero|badnik|monitor)$/.test(object) || second === undefined || hits === undefined || !Number.isInteger(second) || second < 0 || second > 19 || !Number.isInteger(hits) || hits < 1 || hits > 10 || !/^(?:even|odd)$/.test(first ?? "") || !/^(?:even|odd)$/.test(last ?? "")) return "";
      return commands([`press ${object} at ${String(second).padStart(2,"0")}`, hits > 1 ? `${first} ${hits-1}` : undefined, `${last} 1`]);
    }
    case ModuleType.QUINTUPLES: {
      const answer = stringValue(raw.answer);
      return answer && /^\d{5}$/.test(answer) ? command(`submit ${answer}`) : "";
    }
    case ModuleType.THE_SPHERE: {
      const actions = arrayValue(raw.actions).map(asRecord);
      const parts = actions.map(action => { const type=stringValue(action.type)?.toLowerCase(),value=numberValue(action.value); return value!==undefined&&Number.isInteger(value)&&((type==="tap"&&value>=0&&value<=9)||(type==="hold"&&value>=1&&value<=10))?`${type} ${value}`:undefined; });
      return parts.length&&parts.every(Boolean)?command(parts.join("; ")):"";
    }
    case ModuleType.COFFEEBUCKS: {
      const name=stringValue(raw.customerName),drink=stringValue(raw.selectedDrink),quirk=stringValue(raw.quirkCommand)?.toLowerCase();
      if(!name||!/^\S+$/.test(name)||!drink||!drink.trim()||(quirk&&!/^(?:milk|cream|gluten|sprinkles)$/.test(quirk)))return "";
      return commands([`name ${name} 0`,quirk,`submit ${drink}`]);
    }
    case ModuleType.COLORFUL_MADNESS: {
      const presses=arrayValue(raw.presses).map(numberValue);return presses.length===6&&presses.every(x=>x!==undefined&&Number.isInteger(x)&&x>=1&&x<=20)?command(`press ${presses.join(" ")}`):"";
    }
    case ModuleType.BASES:{const answer=stringValue(raw.answer);return answer&&/^[0-9]+$/.test(answer)?command(answer):"";}
    case ModuleType.LIONS_SHARE:{const portions=arrayValue(raw.portions).map(asRecord);if(portions.length<2||portions.length>8)return"";const sets=portions.map(p=>{const lion=stringValue(p.lion),percentage=numberValue(p.percentage);return lion&&/^\w+$/.test(lion)&&percentage!==undefined&&Number.isInteger(percentage)&&percentage>=0&&percentage<=100?`set ${lion} ${percentage}`:undefined;});return sets.every(Boolean)?command(`${sets.join(", ")}, submit`):"";}
    case ModuleType.SNOOKER:{const actions=strings(raw.actions).map(x=>x.toLowerCase());return actions.length&&actions.every(x=>/^(?:red|yellow|green|brown|blue|pink|black|cue)$/.test(x))?command(actions.join(" ")):"";}
    case ModuleType.BLACKJACK:{const actions=strings(raw.actions).map(x=>x.toLowerCase());return actions.length&&actions.every(x=>/^(?:bet (?:1|10|100|250)|hit|stand|check)$/.test(x))?commands(actions):"";}
    case ModuleType.PARTY_TIME:{const actions=strings(raw.actions).map(x=>x.toLowerCase());return actions.length&&actions.at(-1)==="roll start"&&actions.every(x=>x==="roll start"||/^(?:die|space) (?:[1-9]|1[0-8])(?: (?:[1-9]|1[0-8]))*$/.test(x))?commands(actions):"";}
    case ModuleType.ACCUMULATION:{const answer=numberValue(raw.currentAnswer);return answer!==undefined&&Number.isInteger(answer)&&answer>=0&&answer<=999?command(`submit ${answer}`):"";}
    case ModuleType.THE_PLUNGER_BUTTON:{const press=numberValue(raw.pressDigit),release=numberValue(raw.releaseDigit);return press!==undefined&&release!==undefined&&Number.isInteger(press)&&Number.isInteger(release)&&press>=0&&press<=9&&release>=0&&release<=9?command(`hold on ${press}, release on ${release}`):"";}
    case ModuleType.THE_DIGIT:{const answer=numberValue(raw.answer);return answer!==undefined&&Number.isInteger(answer)&&answer>=0&&answer<=9?command(`submit ${answer}`):"";}
    case ModuleType.THE_JACK_O_LANTERN:{const press=stringValue(raw.press)?.toLowerCase();return press==="trick"||press==="treat"?command(press):"";}
    case ModuleType.T_WORDS:{const positions=arrayValue(raw.positions)?.map(numberValue);return positions?.length===4&&positions.every(x=>x!==undefined&&Number.isInteger(x)&&x>=1&&x<=4)&&new Set(positions).size===4?command(`press ${positions.join("")}`):"";}
    case ModuleType.DIVIDED_SQUARES:{const action=stringValue(raw.action)?.toLowerCase(),square=stringValue(raw.square)?.toLowerCase();return(action==="examine"||action==="submit")&&square&&/^[a-m](?:[1-9]|1[0-3])$/.test(square)?command(`${action} ${square}`):"";}
    case ModuleType.CONNECTION_DEVICE:return strings(raw.commands).length===4?commands(strings(raw.commands)):"";
    case ModuleType.INSTRUCTIONS:{const position=numberValue(raw.position);return position!==undefined&&Number.isInteger(position)&&position>=1&&position<=4?command(`press ${position}`):"";}
    case ModuleType.VALVES:{const toggles=arrayValue(raw.twitchToggles)?.map(numberValue);return toggles?.length&&toggles.length<=9&&toggles.every(x=>x!==undefined&&Number.isInteger(x)&&x>=1&&x<=3)?command(`toggle ${toggles.join(" ")}`):"";}
    case ModuleType.BLOCKBUSTERS:{const coordinate=stringValue(raw.coordinate)?.toUpperCase();return coordinate&&/^[A-E][1-5]$/.test(coordinate)?command(coordinate):"";}
    case ModuleType.CATCHPHRASE:{const presses=arrayValue(raw.presses).map(asRecord),product=numberValue(raw.product);if(presses.length!==4||product===undefined||!Number.isInteger(product)||product<32||product>59049)return"";const steps=presses.map(press=>{const position=numberValue(press.position),digit=numberValue(press.timerDigit);return position!==undefined&&digit!==undefined&&Number.isInteger(position)&&position>=1&&position<=4&&Number.isInteger(digit)&&digit>=0&&digit<=9?`panel ${position} at ${digit}`:undefined;});return steps.every(Boolean)&&new Set(presses.map(x=>numberValue(x.position))).size===4?commands([...steps,`submit ${product}`]):"";}
    case ModuleType.COUNTDOWN:{const operations=arrayValue(raw.operations).map(asRecord);if(!operations.length)return"";const steps=operations.map(operation=>{const left=numberValue(operation.left),right=numberValue(operation.right),operator=stringValue(operation.operator);return left!==undefined&&right!==undefined&&operator&&/^[+\-*/]$/.test(operator)?`${left} ${operator} ${right}`:undefined;});return steps.every(Boolean)?commands(["activate",...steps]):"";}
    case ModuleType.CRUEL_COUNTDOWN:{const operations=arrayValue(raw.operations).map(asRecord);if(!operations.length)return"";const steps=operations.map(operation=>{const left=numberValue(operation.left),right=numberValue(operation.right),operator=stringValue(operation.operator);return left!==undefined&&right!==undefined&&operator&&/^[+\-*/]$/.test(operator)?`${left} ${operator} ${right}`:undefined;});return steps.every(Boolean)?commands(["activate",...steps]):"";}
    case ModuleType.ENCRYPTED_MORSE:{const morse=stringValue(raw.responseMorse);return morse&&/^[.-]+$/.test(morse)?command(`submit ${morse}`):"";}
    case ModuleType.THE_CRYSTAL_MAZE:return"";
    case ModuleType.IKEA:{const presses=arrayValue(raw.presses).map(numberValue);return presses.length&&presses.every(x=>x!==undefined&&Number.isInteger(x)&&x>=1&&x<=5)?command(`press ${presses.join(" ")}`):"";}
    case ModuleType.RETIREMENT:{const home=stringValue(raw.home);return home&&["Briar Hollow","Broadwood","Homestead","Hotham Place","Leafy Green","Lodge Park","Riverside","Riverwell","Sunnydale","Sunnyside"].includes(home)?command(home):"";}
    case ModuleType.ONE_HUNDRED_AND_ONE_DALMATIANS:{const name=stringValue(raw.name);return name&&/^[A-Za-z. -]+$/.test(name)?command(name):"";}
    case ModuleType.PERIODIC_TABLE:{const atomicNumber=numberValue(raw.atomicNumber);return atomicNumber!==undefined&&Number.isInteger(atomicNumber)&&atomicNumber>=1&&atomicNumber<=118?command(`submit ${atomicNumber}`):"";}
    case ModuleType.SCHLAG_DEN_BOMB:{const contestant=arrayValue(raw.contestantGames).map(numberValue),unplayed=arrayValue(raw.unplayedGames).map(numberValue);if(!contestant.every(x=>x!==undefined&&Number.isInteger(x)&&x>=1&&x<=15)||!unplayed.every(x=>x!==undefined&&Number.isInteger(x)&&x>=12&&x<=15))return"";const steps=[`b ${Array.from({length:15},(_,i)=>i+1).join(" ")}`];if(contestant.length)steps.push(`c ${contestant.join(" ")}`);if(unplayed.length)steps.push(`u ${unplayed.join(" ")}`);steps.push("submit");return commands(steps);}
    case ModuleType.MAHJONG:{const pair=strings(raw.pair);return pair.length===2&&pair.every(tile=>tile.length>0)?command(`${pair[0]},${pair[1]}`):"";}
    case ModuleType.KUDOSUDOKU:return typeof raw.submission==="string"&&raw.submission.trim()?command(raw.submission):"";
    case ModuleType.THE_RADIO:return strings(raw.commands).length?commands(strings(raw.commands)):"";
    case ModuleType.MODULO:{const answer=numberValue(raw.answer);return answer!==undefined?command(`submit ${answer}`):"";}
    case ModuleType.NUMBER_NIMBLENESS:{const press=numberValue(raw.press);return press!==undefined&&Number.isInteger(press)&&press>=0&&press<=9?command(`press ${press}`):"";}
    case ModuleType.PAY_RESPECTS:return command("f");
    case ModuleType.CHALLENGE_AND_CONTACT:{const answer=stringValue(raw.answer);return answer&&/^[A-Z]+$/i.test(answer)?command(`submit ${answer.toLowerCase()}`):"";}
    case ModuleType.THE_TRIANGLE:{const position=stringValue(raw.position);return position&&["MID","TL","BL","BR"].includes(position)?command(`press ${position.toLowerCase()}`):"";}
    case ModuleType.SUEET_WALL:{const coordinates=strings(raw.pressCoordinates);return coordinates.length&&coordinates.every(x=>/^[A-D][1-5]$/i.test(x))?command(`press ${coordinates.join(" ")}`):"";}
    case ModuleType.HOT_POTATO:return raw.action==="DROP_BOMB"?"!bomb drop":"";
    case ModuleType.CHRISTMAS_PRESENTS:{const hour=numberValue(raw.hour);return hour!==undefined&&Number.isInteger(hour)&&hour>=7&&hour<=20?command(String(hour)):"";}
    case ModuleType.HIEROGLYPHICS:{const a=stringValue(raw.anubisPosition),h=stringValue(raw.horusPosition),d=numberValue(raw.timerDigit);return a&&h&&d!==undefined&&["LEFT","CENTER","RIGHT"].includes(a)&&["LEFT","CENTER","RIGHT"].includes(h)&&Number.isInteger(d)&&d>=1&&d<=9?command(`${a.toLowerCase()} ${h.toLowerCase()} ${d}`):"";}
    case ModuleType.FUNCTIONS:{const answer=numberValue(raw.answer);if(answer!==undefined&&Number.isInteger(answer)&&answer>=0)return command(`submit ${answer}`);const q=arrayValue(raw.suggestedQuery),a=numberValue(q[0]),b=numberValue(q[1]);return a!==undefined&&b!==undefined&&Number.isInteger(a)&&Number.isInteger(b)&&a>0&&b>0&&a!==b?command(`query ${a}, ${b}`):"";}
    case ModuleType.NEEDY_MRS_BOB:{const p=numberValue(raw.responsePosition);return p!==undefined&&Number.isInteger(p)&&p>=1&&p<=24?command(`send ${p}`):"";}
    case ModuleType.SCRIPTING:{const u=arrayValue(raw.usingNecessary),v=stringValue(raw.variableType),m=stringValue(raw.methodType),a=stringValue(raw.action);const actions:Record<string,string>={HANDLE_SOLVE:"handlesolve()",HANDLE_STRIKE:"handlestrike()",SOLVE:"solve()",STRIKE:"strike()",ON_SOLVE:"onsolve()",ON_STRIKE:"onstrike()"};return u.length===3&&u.every(x=>typeof x==="boolean")&&v&&["INT","FLOAT","BOOL","CHAR"].includes(v)&&m&&["VOID","BOOL"].includes(m)&&a&&actions[a]?commands([`set using1 ${u[0]}`,`set using2 ${u[1]}`,`set using3 ${u[2]}`,`set var ${v.toLowerCase()}`,`set method ${m.toLowerCase()}`,`set action ${actions[a]}`,"run"]):"";}
    case ModuleType.SIMON_SPINS:{if(raw.confirmedSolved===true)return"";const p=strings(raw.presses),keys:Record<string,string>={CIRCLE:"c",PENTAGON:"p",SQUARE:"s"};return p.length>0&&p.every(x=>keys[x])?command(p.map(x=>keys[x]).join(" ")):"";}
    case ModuleType.CURSED_DOUBLE_OH:{const p=strings(raw.presses),valid=new Set(["VERT1","HORIZ1","HORIZ2","VERT2","SUBMIT"]);return p.length>0&&p.at(-1)==="SUBMIT"&&p.every(x=>valid.has(x))?command(`press ${p.map(x=>x.toLowerCase()).join(" ")}`):"";}
    case ModuleType.TEN_BUTTON_COLOR_CODE:{const p=arrayValue(raw.presses).map(numberValue);return p.every(x=>x!==undefined&&Number.isInteger(x)&&x>=1&&x<=10)?commands([p.length?`press ${p.join(" ")}`:undefined,"submit"]):"";}
    case ModuleType.CRACKBOX:{const tokens=strings(raw.twitchTokens);return tokens.length&&tokens.every(token=>/^(?:[udlr]|10|[1-9])$/.test(token))?commands([tokens.join(" "),"check"]):"";}
    case ModuleType.STREET_FIGHTER:{const fighter=stringValue(raw.fighter),opponent=stringValue(raw.opponent);return fighter&&opponent?command(`select ${fighter}, ${opponent}`):"";}
    case ModuleType.IMBALANCE:{const answer=numberValue(raw.answer);return answer!==undefined&&Number.isInteger(answer)&&answer>=0&&answer<=16129?command(`press ${answer}`):"";}
    case ModuleType.SEQUENCES:{const formula=stringValue(raw.formula);return formula&&/^(?:n|-n|(?:-?(?:[2-9]|[1-9]\d))n)(?:[+-](?:[1-9]|[1-9]\d))?$/.test(formula)?command(`submit ${formula}`):"";}
    case ModuleType.FAULTY_DIGITAL_ROOT:{const presses=strings(raw.presses);return presses.length===4&&presses.every(press=>press==="YES"||press==="NO")?command(`press ${presses.map(press=>press.toLowerCase()).join(" ")}`):"";}
    case ModuleType.THREE_LEDS:{const toggles=arrayValue(raw.togglePositions).map(numberValue);return toggles.every(position=>position!==undefined&&Number.isInteger(position)&&position>=1&&position<=3)?commands([toggles.length?`toggle ${toggles.join(" ")}`:undefined,"submit"]):"";}
    case ModuleType.SIMPLETON:return raw.action==="PUSH"?command("push"):"";
    case ModuleType.THE_NEUTRAL_BUTTON:return raw.action==="BLINK"?command("blink"):"";
    case ModuleType.TANGRAMS: {
      const pairs = arrayValue(raw.connections).map(asRecord);
      if (pairs.length !== 3) return "";
      const steps = pairs.map((pair) => {
        const positive = numberValue(pair.positivePin);
        const negative = numberValue(pair.negativePin);
        return positive !== undefined && negative !== undefined
          && Number.isInteger(positive) && Number.isInteger(negative)
          && positive >= 1 && positive <= 16 && negative >= 1 && negative <= 16
          ? `set ${positive} ${negative}`
          : undefined;
      });
      return steps.every(Boolean) ? commands(steps) : "";
    }
    case ModuleType.BITWISE_OPERATIONS: {
      const answer = stringValue(raw.answer);
      return answer ? command(`submit ${answer}`) : "";
    }
    case ModuleType.FAST_MATH: {
      const answer = stringValue(raw.answer);
      return answer ? command(`submit ${answer}`) : "";
    }
    case ModuleType.BOOLEAN_VENN_DIAGRAM: {
      const regions = strings(raw.regions).map((region) => ["OUTSIDE", "NONE"].includes(region.toUpperCase()) ? "O" : region.toLowerCase());
      return regions.length ? command(regions.join(" ")) : "";
    }
    case ModuleType.ZOO: {
      const animals = strings(raw.animals);
      return animals.length ? command(`press ${animals.join(", ")}`) : "";
    }
    case ModuleType.POINT_OF_ORDER: {
      const cards = strings(raw.validCards);
      const ranks = [...new Set(cards.map((card) => card.slice(0, -1)))];
      const suits = [...new Set(cards.map((card) => card.at(-1)).filter(Boolean))];
      return ranks.length && suits.length ? command(`play ${ranks.join("/")} of ${suits.join("/")}`) : "";
    }
    case ModuleType.POKER: {
      const stage = numberValue(raw.stage);
      if (stage === 1) {
        const calls: Record<string, string> = {
          FOLD: "fold", CHECK: "check", MIN_RAISE: "min", MAX_RAISE: "max", ALL_IN: "allin",
        };
        return calls[String(raw.call)] ? command(`press ${calls[String(raw.call)]}`) : "";
      }
      if (stage === 2) {
        const answer = stringValue(raw.truthOrBluff)?.toLowerCase();
        return answer === "truth" || answer === "bluff" ? command(`press ${answer}`) : "";
      }
      if (stage === 3) {
        const position = numberValue(raw.cardPosition);
        return Number.isInteger(position) && position! >= 1 && position! <= 4 ? command(`press card${position}`) : "";
      }
      return "";
    }
    case ModuleType.NONOGRAM: {
      const cells = strings(raw.filledCells).map((cell) => cell.toUpperCase());
      return cells.length && cells.every((cell) => /^[A-E][1-5]$/.test(cell))
        ? commands([`fill ${cells.join(" ")}`, "submit"])
        : "";
    }
    case ModuleType.VISUAL_IMPAIRMENT: {
      const positions = strings(raw.positions).map((position) => position.toLowerCase());
      return positions.length && positions.every((position) => /^[a-e][1-5]$/.test(position))
        ? command(`press ${positions.join(" ")}`)
        : "";
    }
    case ModuleType.SET: {
      const positions = strings(raw.positions).map((position) => position.toLowerCase());
      return positions.length === 3 && new Set(positions).size === 3 && positions.every((position) => /^[a-c][1-3]$/.test(position))
        ? command(`press ${positions.join(" ")}`)
        : "";
    }
    case ModuleType.HUNTING: {
      const safeButton = numberValue(raw.safeButton);
      return safeButton !== undefined && safeButton >= 1 && safeButton <= 5 ? command(`press ${safeButton}`) : "";
    }
    case ModuleType.CURRICULUM: {
      const clicks = arrayValue(raw.clicks);
      if(clicks.length !== 5 || clicks.some((click) => typeof click !== "number" || !Number.isInteger(click) || click < 0 || click > 5)) return "";
      return commands(clicks.map((click, index) => click === 0 ? undefined : `click ${index + 1}${click === 1 ? "" : ` ${click}`}`).concat("submit"));
    }
    case ModuleType.PAINTING: {
      const repaints = arrayValue(raw.repaints).map(asRecord);
      if(!repaints.length || repaints.some((repaint) => !/^[A-Za-z0-9]+$/.test(stringValue(repaint.label) ?? "") || !stringValue(repaint.to))) return "";
      return commands(repaints.map((repaint) => `paint ${repaint.label} ${words(repaint.to)}`));
    }
    case ModuleType.THE_IPHONE: {
      const pin = stringValue(raw.pin);
      return pin && /^\d{4}$/.test(pin) ? command(`submit ${pin}`) : "";
    }
    case ModuleType.BURGLAR_ALARM: {
      const code = stringValue(raw.code);
      return code && /^\d{8}$/.test(code) ? commands(["activate", `submit ${code}`]) : "";
    }
    case ModuleType.ERROR_CODES: {
      const fixCode = stringValue(raw.fixCode);
      return fixCode && /^[0-9A-F]{2,7}$/.test(fixCode) ? command(`submit ${fixCode}`) : "";
    }
    case ModuleType.PRESS_X: {
      const button = stringValue(raw.button);
      const seconds = arrayValue(raw.validSeconds).map(Number);
      if (booleanValue(raw.anyTime)) return command("press x");
      return button && /^[XYAB]$/.test(button) && seconds.length
        && seconds.every((second) => Number.isInteger(second) && second >= 0 && second < 60)
        ? command(`press ${button.toLowerCase()} on ${seconds.map((second) => second.toString().padStart(2, "0")).join(" ")}`)
        : "";
    }
    case ModuleType.THE_CODE: {
      const code = numberValue(raw.code);
      return code !== undefined && Number.isInteger(code) && code >= 1 && code <= 9999
        ? command(`submit ${code}`)
        : "";
    }
    case ModuleType.SYNONYMS: {
      const targetWord = stringValue(raw.targetWord);
      return targetWord ? command(`submit ${targetWord.toLowerCase()}`) : "";
    }
    case ModuleType.TAP_CODE: {
      const taps = strings(raw.tapCode);
      return taps.length === 5 && taps.every((pair) => /^[1-5]{2}$/.test(pair))
        ? command(`tap ${taps.join(" ")}`)
        : "";
    }
    case ModuleType.DIGITAL_ROOT: {
      const button = stringValue(raw.button);
      return button && /^(YES|NO)$/.test(button) ? command(`press ${button.toLowerCase()}`) : "";
    }
    case ModuleType.THE_SWAN: {
      const code = stringValue(raw.code);
      const positions = arrayValue(raw.buttonPositions).map(Number);
      return code && /^(DHARMA|HATCH|SWN|DARMA|SWAN|HTCH|77)$/.test(code)
        && positions.length === code.length
        && positions.every((position) => Number.isInteger(position) && position >= 1 && position <= 12)
        ? command(`execute ${positions.join(" ")}`)
        : "";
    }
    case ModuleType.THE_NUMBER: {
      const positions = arrayValue(raw.buttonPositions).map(Number);
      return positions.length === 4
        && positions.every((position) => Number.isInteger(position) && position >= 1 && position <= 10)
        ? command(`press ${positions.join(" ")} submit`)
        : "";
    }
    case ModuleType.WASTE_MANAGEMENT: {
      const barEmpty = booleanValue(raw.barEmpty);
      if (barEmpty === undefined) return "";
      if (barEmpty) return command("submit");
      const stageIndex = numberValue(raw.stageIndex);
      const allocation = stageIndex === undefined ? {} : asRecord(arrayValue(raw.allocations)[stageIndex]);
      const recycle = numberValue(allocation.recycle);
      const waste = numberValue(allocation.waste);
      if (stageIndex === undefined || !Number.isInteger(stageIndex) || stageIndex < 0
        || recycle === undefined || waste === undefined
        || !Number.isInteger(recycle) || !Number.isInteger(waste) || recycle < 0 || waste < 0) return "";
      const roman = (value: number) => {
        const l = Math.floor(value / 50); value %= 50;
        const x = Math.floor(value / 10); value %= 10;
        const v = Math.floor(value / 5); value %= 5;
        return "L".repeat(l) + "X".repeat(x) + "V".repeat(v) + "I".repeat(value);
      };
      return commands([waste ? `${roman(waste)}W` : undefined, recycle ? `${roman(recycle)}R` : undefined, "submit"]);
    }
    case ModuleType.HUMAN_RESOURCES: {
      const fire = stringValue(raw.fire);
      const hire = stringValue(raw.hire);
      return fire && hire ? commands([`fire ${words(fire)}`, `hire ${words(hire)}`]) : "";
    }
    case ModuleType.EUROPEAN_TRAVEL: {
      const type = stringValue(raw.ticketType);
      const travelClass = stringValue(raw.travelClass);
      const departure = stringValue(raw.departure);
      const destination = stringValue(raw.destination);
      const seat = stringValue(raw.seat);
      const price = stringValue(raw.price);
      if (!type || !travelClass || !departure || !destination || !seat || !price) return "";
      const ticket = type === "SGL" ? "single ticket" : type === "RTN" ? "return ticket" : "";
      return ticket ? command(`submit ${ticket};${travelClass};${departure};${destination};${seat};${price}`) : "";
    }
    case ModuleType.SKYRIM: {
      const values = [raw.race, raw.weapon, raw.enemy, raw.city, raw.dragonShout].map(stringValue);
      return values.every((value) => value) ? command(`submit ${values.join(", ")}`) : "";
    }
    case ModuleType.MAINTENANCE: {
      const jobs = strings(raw.jobs);
      return jobs.length ? command(jobs.join(", ")) : "";
    }
    case ModuleType.BACKGROUNDS: {
      const target = numberValue(raw.targetCount);
      return target !== undefined && Number.isInteger(target) && target >= 1 && target <= 9
        ? command(`submit ${target}`)
        : "";
    }
    case ModuleType.FAULTY_BACKGROUNDS: {
      const side = stringValue(raw.correctButton)?.toLowerCase();
      const target = numberValue(raw.targetCount);
      return (side === "left" || side === "right") && target !== undefined && Number.isInteger(target) && target >= 1 && target <= 9
        ? command(`submit ${side} ${target}`)
        : "";
    }
    case ModuleType.MORTAL_KOMBAT: {
      const attacks = arrayValue(raw.attacks).map(asRecord).map((move) => stringValue(move.controls));
      const fatality = stringValue(asRecord(raw.fatality).controls);
      return attacks.length === 3
        && attacks.every((controls) => controls !== undefined && /^[⇧⇩⇦⇨ABC]{3}$/.test(controls))
        && fatality !== undefined && /^[⇧⇩⇦⇨ABC]{6}$/.test(fatality)
        ? command([...attacks, fatality].join(" "))
        : "";
    }
    case ModuleType.MASHEMATICS: {
      const presses = numberValue(raw.pressCount);
      return presses !== undefined && Number.isInteger(presses) && presses >= 0 && presses <= 99
        ? command(`submit ${presses}`)
        : "";
    }
    case ModuleType.GREEK_CALCULUS: {
      const answer = numberValue(raw.answer);
      return answer !== undefined && Number.isInteger(answer)
        ? command(`submit ${answer}`)
        : "";
    }
    case ModuleType.RADIATOR: {
      const temperature = numberValue(raw.temperature);
      const water = numberValue(raw.water);
      return temperature !== undefined && water !== undefined
        && Number.isInteger(temperature) && Number.isInteger(water)
        && temperature >= 0 && temperature <= 99 && water >= 0 && water <= 99
        ? command(`submit ${temperature} ${water}`)
        : "";
    }
    case ModuleType.SINK: {
      const sequence = strings(raw.sequence);
      return sequence.length === 3 && sequence.every((knob) => knob === "HOT" || knob === "COLD")
        ? command(sequence.map(words).join(" "))
        : "";
    }
  }
}
