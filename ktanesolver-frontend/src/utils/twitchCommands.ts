import { ModuleType } from "../types";

export interface TwitchCommandData {
  moduleType: ModuleType;
  result: unknown;
}

export type TwitchCommandSupport = "verified" | "conditional";

const conditional = new Set<ModuleType>([
  ModuleType.BUTTON,
  ModuleType.CAPACITOR_DISCHARGE,
  ModuleType.COLORED_SQUARES,
  ModuleType.COORDINATES,
  ModuleType.ENGLISH_TEST,
  ModuleType.GAME_OF_LIFE_CRUEL,
  ModuleType.KNOBS,
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
]);

/** Exhaustive audit status; the test suite asserts that every ModuleType is present. */
export const TWITCH_COMMAND_SUPPORT: Record<ModuleType, TwitchCommandSupport> = Object.fromEntries(
  Object.values(ModuleType).map((type) => [
    type,
    conditional.has(type) ? "conditional" : "verified",
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
      return commands([`base ${base}`, `conc set ${drops}`, booleanValue(raw.filterOn) ? "filter" : undefined, "titrate"]);
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
    case ModuleType.FIZZ_BUZZ: {
      const actions = strings(raw.actions);
      return actions.length ? command(`submit ${actions.map(words).join(" ")}`) : "";
    }
    case ModuleType.THE_CLOCK: {
      const target = stringValue(raw.targetTime);
      return target ? command(`set ${target.toLowerCase()}`) : "";
    }
    case ModuleType.LED_ENCRYPTION: {
      const letter = strings(raw.correctLetters)[0] ?? stringValue(raw.letter);
      return letter ? command(`press ${letter}`) : "";
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
    case ModuleType.RADIATOR: {
      const temperature = numberValue(raw.temperature);
      const water = numberValue(raw.water);
      return temperature !== undefined && water !== undefined
        && Number.isInteger(temperature) && Number.isInteger(water)
        && temperature >= 0 && temperature <= 99 && water >= 0 && water <= 99
        ? command(`submit ${temperature} ${water}`)
        : "";
    }
  }
}
