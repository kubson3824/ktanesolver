import { ModuleType } from "../types";

export interface TwitchCommandData {
  moduleType: ModuleType;
  result: unknown;
}

const TWITCH_PLACEHOLDER = "number";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function getStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? (value as string[])
    : undefined;
}

export function generateTwitchCommand(data: TwitchCommandData): string {
  const { moduleType, result } = data;
  const raw = asRecord(result);
  
  switch (moduleType) {
    case ModuleType.WIRES:
      return `!${TWITCH_PLACEHOLDER} cut ${(result as { wirePosition: number }).wirePosition + 1}`;
    
    case ModuleType.BUTTON:
      if ((result as { hold: boolean }).hold) {
        return `!${TWITCH_PLACEHOLDER} hold`;
      } else {
        return `!${TWITCH_PLACEHOLDER} press`;
      }
    
    case ModuleType.MEMORY:
      return `!${TWITCH_PLACEHOLDER} press ${(result as { position: string }).position}`;
    
    case ModuleType.KEYPADS:
      // Assuming result has the button to press - convert position to TL TR BL BR format
      if ((result as { position: string }).position) {
        const positionMap: Record<string, string> = {
          'TOP_LEFT': 'TL',
          'TOP_RIGHT': 'TR',
          'BOTTOM_LEFT': 'BL',
          'BOTTOM_RIGHT': 'BR',
          'TL': 'TL',
          'TR': 'TR',
          'BL': 'BL',
          'BR': 'BR',
          '0': 'TL',
          '1': 'TR',
          '2': 'BL',
          '3': 'BR'
        };
        const position = positionMap[(result as { position: string }).position.toString().toUpperCase()] || (result as { position: string }).position;
        return `!${TWITCH_PLACEHOLDER} press ${position}`;
      }
      // Fallback to label if position not available
      return `!${TWITCH_PLACEHOLDER} press ${(result as { label?: string; button?: string }).label || (result as { label?: string; button?: string }).button || 'unknown'}`;

    case ModuleType.SIMON_SAYS:
      // Handle color-based input (e.g., "RED", "BLUE", "GREEN", "YELLOW")
      if ((result as { color: string }).color) {
        return `!${TWITCH_PLACEHOLDER} press ${(result as { color: string }).color.toUpperCase()}`;
      }
      // Handle position-based input and convert to color
      else if ((result as { position: string }).position) {
        // Map positions to colors
        const positionToColor: Record<string, string> = {
          'TOP_LEFT': 'BLUE',
          'TOP_RIGHT': 'YELLOW',
          'BOTTOM_LEFT': 'GREEN',
          'BOTTOM_RIGHT': 'RED'
        };
        const position = (result as { position: string }).position.toUpperCase();
        const color = positionToColor[position] || position;
        return `!${TWITCH_PLACEHOLDER} press ${color}`;
      }
      // Fallback to sequence if available
      else if ((result as { sequence: string[] }).sequence) {
        return `!${TWITCH_PLACEHOLDER} sequence ${(result as { sequence: string[] }).sequence.join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} action unknown`;

    case ModuleType.MORSE_CODE:
      // Assuming result has the word to transmit
      return `!${TWITCH_PLACEHOLDER} transmit ${(result as { word: string }).word}`;
    
    case ModuleType.FORGET_ME_NOT:
      if (getString(raw.action) === "display") {
        return `!${TWITCH_PLACEHOLDER} display ${getString(raw.value) ?? getNumber(raw.value) ?? "unknown"}`;
      } else if (getString(raw.action) === "press") {
        return `!${TWITCH_PLACEHOLDER} press ${getString(raw.label) ?? "unknown"}`;
      }
      if (Array.isArray(raw.sequence)) {
        return `!${TWITCH_PLACEHOLDER} sequence ${(raw.sequence as unknown[]).join(" ")}`;
      }
      return `!${TWITCH_PLACEHOLDER} ${getString(raw.action) ?? "unknown"}`;
    
    case ModuleType.WHOS_ON_FIRST:
    case ModuleType.THIRD_BASE:
      return `!${TWITCH_PLACEHOLDER} press ${getString(raw.button) ?? getString(raw.buttonText) ?? "unknown"}`;
    
    case ModuleType.VENTING_GAS:
      return `!${TWITCH_PLACEHOLDER} ${getString(raw.action) ?? "unknown"}`;
    
    case ModuleType.CAPACITOR_DISCHARGE:
      return `!${TWITCH_PLACEHOLDER} ${getString(raw.action) ?? "unknown"}`;
    
    case ModuleType.COMPLICATED_WIRES:
      return `!${TWITCH_PLACEHOLDER} cut ${getString(raw.wire) ?? getNumber(raw.wire) ?? "unknown"}`;
    
    case ModuleType.WIRE_SEQUENCES:
      return `!${TWITCH_PLACEHOLDER} cut ${getNumber(raw.wirePosition) ?? getString(raw.wirePosition) ?? "unknown"}`;
    
    case ModuleType.PASSWORDS:
      return `!${TWITCH_PLACEHOLDER} submit ${getString(raw.password) ?? "unknown"}`;
    
    case ModuleType.MAZES:
      if (Array.isArray(raw.directions)) {
        const directionLetters = (raw.directions as unknown[]).map((dir) => {
          const direction = String(dir);
          // Map full direction names to first letters
          const directionMap: Record<string, string> = {
            'UP': 'U',
            'DOWN': 'D',
            'LEFT': 'L',
            'RIGHT': 'R',
            'U': 'U',
            'D': 'D',
            'L': 'L',
            'R': 'R'
          };
          return directionMap[direction.toUpperCase()] || direction;
        });
        return `!${TWITCH_PLACEHOLDER} ${directionLetters.join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} ${getString(raw.action) ?? 'unknown'}`;
    
    case ModuleType.EMOJI_MATH:
      return `!${TWITCH_PLACEHOLDER} answer ${getString(raw.answer) ?? getNumber(raw.answer) ?? "unknown"}`;
    
    case ModuleType.SWITCHES:
      return `!${TWITCH_PLACEHOLDER} ${getString(raw.instruction) ?? "unknown"}`;
    
    case ModuleType.TWO_BITS:
      return `!${TWITCH_PLACEHOLDER} display ${getString(raw.letters) ?? "unknown"}`;
    
    case ModuleType.WORD_SCRAMBLE:
      return `!${TWITCH_PLACEHOLDER} word ${getString(raw.solution) ?? getString(raw.instruction) ?? 'unknown'}`;

    case ModuleType.BROKEN_BUTTONS:
      return getString(raw.action) === "SUBMIT"
        ? `!${TWITCH_PLACEHOLDER} submit ${getString(raw.submitSide)?.toLowerCase() ?? "unknown"}`
        : `!${TWITCH_PLACEHOLDER} press ${getNumber(raw.column) ?? "?"} ${getNumber(raw.row) ?? "?"}`;

    case ModuleType.COMPLICATED_BUTTONS:
      return `!${TWITCH_PLACEHOLDER} press ${Array.isArray(raw.pressOrder) ? raw.pressOrder.join(" ") : "unknown"}`;
    
    case ModuleType.ANAGRAMS:
      if (getStringArray(raw.possibleSolutions)?.length) {
        return `!${TWITCH_PLACEHOLDER} anagrams ${getStringArray(raw.possibleSolutions)?.join(', ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} anagrams no solution`;
    
    case ModuleType.COMBINATION_LOCK:
      if (Array.isArray(raw.combination)) {
        return `!${TWITCH_PLACEHOLDER} combo ${(raw.combination as unknown[]).join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} combo ${getNumber(raw.firstNumber) ?? '0'} ${getNumber(raw.secondNumber) ?? '0'} ${getNumber(raw.thirdNumber) ?? '0'}`;
    
    case ModuleType.ROUND_KEYPAD:
      if (getStringArray(raw.symbolsToPress)?.length) {
        return `!${TWITCH_PLACEHOLDER} press ${getStringArray(raw.symbolsToPress)?.join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} press none`;

    case ModuleType.NUMBER_PAD:
      return `!${TWITCH_PLACEHOLDER} submit ${getString(raw.code) ?? "unknown"}`;
    
    case ModuleType.LISTENING:
      if (getString(raw.code)) {
        return `!${TWITCH_PLACEHOLDER} code ${getString(raw.code)}`;
      }
      return `!${TWITCH_PLACEHOLDER} code unknown`;

    case ModuleType.FOREIGN_EXCHANGE_RATES:
      return `!${TWITCH_PLACEHOLDER} key ${getString(raw.keyPosition) ?? getNumber(raw.keyPosition) ?? "unknown"}`;

    case ModuleType.ORIENTATION_CUBE:
      if (Array.isArray(raw.rotations)) {
        const rotationMap: Record<string, string> = {
          'ROTATE_LEFT': 'L',
          'ROTATE_RIGHT': 'R',
          'ROTATE_CLOCKWISE': 'CW',
          'ROTATE_COUNTERCLOCKWISE': 'CCW'
        };
        const rotations = (raw.rotations as unknown[]).map((rot) => {
          const rotation = String(rot);
          return rotationMap[rotation] || rotation;
        }).join(' ');
        return `!${TWITCH_PLACEHOLDER} rotate ${rotations}`;
      }
      return `!${TWITCH_PLACEHOLDER} rotate unknown`;

    case ModuleType.LETTER_KEYS:
      return `!${TWITCH_PLACEHOLDER} press ${getString(raw.letter) ?? "unknown"}`;

    case ModuleType.ASTROLOGY:
      return `!${TWITCH_PLACEHOLDER} omen ${getNumber(raw.omenScore) ?? getString(raw.omenScore) ?? "unknown"}`;

    case ModuleType.CONNECTION_CHECK:
      // For Connection Check, result has ledStates array
      if ((result as { ledStates: boolean[] }).ledStates) {
        const ledStates = (result as { ledStates: boolean[] }).ledStates;
        const ledPattern = ledStates.map(led => led ? 'ON' : 'OFF').join(' ');
        return `!${TWITCH_PLACEHOLDER} leds ${ledPattern}`;
      }
      return `!${TWITCH_PLACEHOLDER} leds unknown`;

    case ModuleType.LOGIC:
      // Logic: result has answers (boolean[]) per row
      if ((result as { answers: boolean[] }).answers) {
        const answers = (result as { answers: boolean[] }).answers;
        const parts = answers.map((a, i) => `Row${i + 1}:${a ? "T" : "F"}`);
        return `!${TWITCH_PLACEHOLDER} logic ${parts.join(" ")}`;
      }
      return `!${TWITCH_PLACEHOLDER} logic unknown`;

    case ModuleType.MYSTIC_SQUARE:
      if (typeof (result as { skullPosition?: number }).skullPosition === "number") {
        const r = result as { skullPosition: number };
        const row = Math.floor(r.skullPosition / 3) + 1;
        const col = (r.skullPosition % 3) + 1;
        return `!${TWITCH_PLACEHOLDER} mystic skull row${row} col${col}`;
      }
      return `!${TWITCH_PLACEHOLDER} mystic unknown`;

    case ModuleType.CRAZY_TALK:
      if (typeof (result as { downAt?: number }).downAt === "number" && typeof (result as { upAt?: number }).upAt === "number") {
        const r = result as { downAt: number; upAt: number };
        return `!${TWITCH_PLACEHOLDER} crazytalk down ${r.downAt} up ${r.upAt}`;
      }
      return `!${TWITCH_PLACEHOLDER} crazytalk unknown`;

    case ModuleType.ADVENTURE_GAME:
      if (Array.isArray((result as { itemsToUse?: string[] }).itemsToUse) && typeof (result as { weaponToUse?: string }).weaponToUse === "string") {
        const r = result as { itemsToUse: string[]; weaponToUse: string };
        const itemsPart = r.itemsToUse.length ? ` items ${r.itemsToUse.join(" ")}` : "";
        return `!${TWITCH_PLACEHOLDER} adventure${itemsPart} weapon ${r.weaponToUse}`;
      }
      return `!${TWITCH_PLACEHOLDER} adventure unknown`;

    case ModuleType.PLUMBING:
      if (Array.isArray((result as { activeInputs?: boolean[] }).activeInputs) && Array.isArray((result as { activeOutputs?: boolean[] }).activeOutputs)) {
        const r = result as { activeInputs: boolean[]; activeOutputs: boolean[] };
        const colors = ["Red", "Yellow", "Green", "Blue"];
        const ins = r.activeInputs.map((a, i) => (a ? colors[i] : null)).filter(Boolean).join(",");
        const outs = r.activeOutputs.map((a, i) => (a ? colors[i] : null)).filter(Boolean).join(",");
        return `!${TWITCH_PLACEHOLDER} plumbing inputs ${ins} outputs ${outs}`;
      }
      return `!${TWITCH_PLACEHOLDER} plumbing unknown`;

    case ModuleType.CRUEL_PIANO_KEYS:
      if ((result as { notes?: string[] }).notes && Array.isArray((result as { notes: string[] }).notes)) {
        const noteStr = (result as { notes: string[] }).notes
          .map((n) => n.replace("_SHARP", "#"))
          .join(" ");
        return `!${TWITCH_PLACEHOLDER} sequence ${noteStr}`;
      }
      return `!${TWITCH_PLACEHOLDER} cruel piano keys unknown`;

    case ModuleType.SAFETY_SAFE:
      if ((result as { dialTurns?: number[] }).dialTurns && Array.isArray((result as { dialTurns: number[] }).dialTurns)) {
        const turns = (result as { dialTurns: number[] }).dialTurns.join(" ");
        return `!${TWITCH_PLACEHOLDER} dials ${turns}`;
      }
      return `!${TWITCH_PLACEHOLDER} safety safe unknown`;

    case ModuleType.CRYPTOGRAPHY:
      if ((result as { keyOrder?: string[] }).keyOrder && Array.isArray((result as { keyOrder: string[] }).keyOrder)) {
        const order = (result as { keyOrder: string[] }).keyOrder.join(" ");
        return `!${TWITCH_PLACEHOLDER} keys ${order}`;
      }
      return `!${TWITCH_PLACEHOLDER} cryptography unknown`;

    case ModuleType.CAESAR_CIPHER:
      return `!${TWITCH_PLACEHOLDER} submit ${getString(raw.solution) ?? "unknown"}`;

    case ModuleType.CHESS:
      if ((result as { coordinate?: string }).coordinate) {
        return `!${TWITCH_PLACEHOLDER} submit ${(result as { coordinate: string }).coordinate}`;
      }
      return `!${TWITCH_PLACEHOLDER} chess unknown`;

    case ModuleType.MOUSE_IN_THE_MAZE: {
      const r = result as { targetSphereColor?: string; moves?: string[] };
      const target = r?.targetSphereColor ?? "unknown";
      const moves = r?.moves?.length ? ` — ${r.moves.join(" ")}` : "";
      return `!${TWITCH_PLACEHOLDER} go to ${target}${moves}`;
    }

    case ModuleType.HEXAMAZE: {
      const moves = (result as { moves?: string[] })?.moves;
      return `!${TWITCH_PLACEHOLDER} ${moves?.length ? moves.join(" ").toLowerCase() : "unknown"}`;
    }

    case ModuleType.THREE_D_MAZE: {
      const r = result as { goalRow?: number; goalCol?: number; goalDirection?: string | null; moves?: string[]; phase?: string };
      const row = r?.goalRow ?? "?";
      const col = r?.goalCol ?? "?";
      const moves = r?.moves?.length ? ` — ${r.moves.join(" ")}` : "";
      if (r?.phase === "go_to_star") {
        return `!${TWITCH_PLACEHOLDER} follow path to star${moves}`;
      }
      return `!${TWITCH_PLACEHOLDER} follow the complete path through the goal wall at (${row},${col})${moves}`;
    }

    case ModuleType.SIMON_STATES:
      return `!${TWITCH_PLACEHOLDER} press ${(result as { press: string }).press}`;

    case ModuleType.SIMON_SCREAMS:
      return `!${TWITCH_PLACEHOLDER} press ${getStringArray(raw.press)?.join(" ").toLowerCase() ?? "unknown"}`;

    case ModuleType.SILLY_SLOTS: {
      const legal = getBoolean(raw.legal);
      return legal ? `!${TWITCH_PLACEHOLDER} press KEEP` : `!${TWITCH_PLACEHOLDER} pull lever`;
    }

    case ModuleType.SKEWED_SLOTS:
      return `!${TWITCH_PLACEHOLDER} submit ${getString(raw.code) ?? "unknown"}`;

    case ModuleType.LAUNDRY: {
      if (getBoolean(raw.bobShortcut)) {
        return `!${TWITCH_PLACEHOLDER} coin`;
      }
      const washing = getString(raw.washingSymbol) ?? "unknown";
      const drying = getString(raw.dryingSymbol) ?? "unknown";
      const ironing = getString(raw.ironingSymbol) ?? "unknown";
      const special = getString(raw.specialSymbol) ?? "unknown";
      return `!${TWITCH_PLACEHOLDER} laundry ${washing} ${drying} ${ironing} ${special}`;
    }

    case ModuleType.PROBING: {
      const r = result as { redClipWire?: number; blueClipWire?: number };
      if (typeof r.redClipWire === "number" && typeof r.blueClipWire === "number") {
        return `!${TWITCH_PLACEHOLDER} probing red ${r.redClipWire} blue ${r.blueClipWire}`;
      }
      return `!${TWITCH_PLACEHOLDER} probing unknown`;
    }

    case ModuleType.ALPHABET: {
      const pressOrder = getStringArray(raw.pressOrder);
      if (pressOrder?.length) {
        return `!${TWITCH_PLACEHOLDER} alphabet ${pressOrder.join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} alphabet unknown`;
    }

    case ModuleType.ADJACENT_LETTERS: {
      const letters = getStringArray(raw.pressLetters);
      return `!${TWITCH_PLACEHOLDER} ${letters?.length ? `submit ${letters.join("")}` : "submit!"}`;
    }

    case ModuleType.MICROCONTROLLER: {
      const pins = Array.isArray(raw.pins) ? raw.pins : [];
      if (pins.length) {
        const sequence = pins
          .map((pin) => asRecord(pin).color)
          .filter((color): color is string => typeof color === "string")
          .map((color) => color.toLowerCase())
          .join(" ");
        return `!${TWITCH_PLACEHOLDER} microcontroller ${sequence}`;
      }
      return `!${TWITCH_PLACEHOLDER} microcontroller unknown`;
    }

    case ModuleType.MURDER: {
      const suspect = getString(raw.suspect)?.toLowerCase().replaceAll("_", " ") ?? "unknown";
      const weapon = getString(raw.weapon)?.toLowerCase().replaceAll("_", " ") ?? "unknown";
      const location = getString(raw.location)?.toLowerCase().replaceAll("_", " ") ?? "unknown";
      return `!${TWITCH_PLACEHOLDER} accuse ${suspect}, ${weapon}, ${location}`;
    }

    case ModuleType.GAMEPAD: {
      const sequence = getStringArray(raw.sequence);
      return `!${TWITCH_PLACEHOLDER} press ${sequence?.join(" ").toLowerCase() ?? "unknown"}`;
    }

    case ModuleType.TIC_TAC_TOE:
      return getString(raw.action) === "PASS"
        ? `!${TWITCH_PLACEHOLDER} press pass`
        : `!${TWITCH_PLACEHOLDER} press ${getNumber(raw.number) ?? "unknown"}`;

    case ModuleType.MONSPLODE_FIGHT:
      return `!${TWITCH_PLACEHOLDER} press ${getString(raw.move)?.toLowerCase() ?? "unknown"}`;

    case ModuleType.FOLLOW_THE_LEADER:
      return `!${TWITCH_PLACEHOLDER} cut ${Array.isArray(raw.cutPlugs) ? raw.cutPlugs.join(" ") : "unknown"}`;

    case ModuleType.WIRE_PLACEMENT:
      return `!${TWITCH_PLACEHOLDER} cut ${Array.isArray(raw.cutWires) ? raw.cutWires.map((wire) => getString(asRecord(wire).coordinate)).filter(Boolean).join(" ") : "unknown"}`;

    case ModuleType.DOUBLE_OH: {
      const aliases: Record<string, string> = {
        SINGLE_VERTICAL: "vert1",
        SINGLE_HORIZONTAL: "horiz1",
        DOUBLE_HORIZONTAL: "horiz2",
        DOUBLE_VERTICAL: "vert2",
        SQUARE: "submit",
      };
      return `!${TWITCH_PLACEHOLDER} ${getStringArray(raw.presses)?.map((press) => aliases[press] ?? press).join(" ") ?? "unknown"}`;
    }

    case ModuleType.CHEAP_CHECKOUT:
      return raw.needsSecondPayment
        ? `!${TWITCH_PLACEHOLDER} submit`
        : `!${TWITCH_PLACEHOLDER} submit ${getNumber(raw.change)?.toFixed(2) ?? "unknown"}`;

    case ModuleType.COORDINATES: {
      const clues = getStringArray(raw.matchingClues);
      return clues?.length === 2
        ? clues.map((clue) => `!${TWITCH_PLACEHOLDER} submit ${clue.replace(/\s+/g, " ")}`).join("; ")
        : `!${TWITCH_PLACEHOLDER} submit unknown`;
    }

    case ModuleType.LIGHT_CYCLE: {
      const codes: Record<string, string> = { RED: "R", YELLOW: "Y", GREEN: "G", BLUE: "B", MAGENTA: "M", WHITE: "W" };
      return `!${TWITCH_PLACEHOLDER} ${getStringArray(raw.sequence)?.map((color) => codes[color] ?? color).join(" ") ?? "unknown"}`;
    }

    case ModuleType.BINARY_LEDS:
      return `!${TWITCH_PLACEHOLDER} cut ${getString(raw.recommendedColor)?.toLowerCase() ?? "unknown"} ${getNumber(raw.recommendedValue) ?? "unknown"}`;

    case ModuleType.RUBIKS_CUBE:
      return `!${TWITCH_PLACEHOLDER} ${getStringArray(raw.moves)?.join(" ").toLowerCase() ?? "unknown"}`;

    case ModuleType.FIZZ_BUZZ:
      return `!${TWITCH_PLACEHOLDER} submit ${getStringArray(raw.actions)?.join(" ").toLowerCase() ?? "unknown"}`;

    case ModuleType.THE_CLOCK:
      return `!${TWITCH_PLACEHOLDER} set ${getString(raw.targetTime)?.toLowerCase() ?? "unknown"}`;

    case ModuleType.LED_ENCRYPTION:
      return `!${TWITCH_PLACEHOLDER} press ${getStringArray(raw.correctLetters)?.[0]?.toLowerCase() ?? "unknown"}`;

    case ModuleType.FAST_MATH:
      return `!${TWITCH_PLACEHOLDER} submit ${getString(raw.answer) ?? "unknown"}`;

    case ModuleType.ICE_CREAM:
      return `!${TWITCH_PLACEHOLDER} sell ${getString(raw.flavor)?.toLowerCase() ?? "unknown"}`;

    case ModuleType.THE_SCREW:
      return `!${TWITCH_PLACEHOLDER} unscrew; !${TWITCH_PLACEHOLDER} screw ${getNumber(raw.hole) ?? "unknown"}; !${TWITCH_PLACEHOLDER} press ${getString(raw.buttonLabel)?.toLowerCase() ?? "unknown"}`;

    case ModuleType.YAHTZEE: {
      if (getString(raw.action) === "SOLVED") return `!${TWITCH_PLACEHOLDER} done`;
      const colors = getStringArray(raw.keepColors)?.map((color) => color.toLowerCase()) ?? [];
      return colors.length ? `!${TWITCH_PLACEHOLDER} keep ${colors.join(" ")}` : `!${TWITCH_PLACEHOLDER} reroll`;
    }

    case ModuleType.X_RAY:
      return `!${TWITCH_PLACEHOLDER} press ${getNumber(raw.button) ?? "unknown"}`;

    case ModuleType.ZOO:
      return `!${TWITCH_PLACEHOLDER} press ${getStringArray(raw.animals)?.join(", ") ?? "unknown"}`;

    case ModuleType.POINT_OF_ORDER: {
      const cards = getStringArray(raw.validCards) ?? [];
      const ranks = [...new Set(cards.map((card) => card.slice(0, -1)))];
      const suits = [...new Set(cards.map((card) => card.at(-1)))];
      return `!${TWITCH_PLACEHOLDER} play ${ranks.join("/") || "unknown"} of ${suits.join("/") || "unknown"}`;
    }

    case ModuleType.RHYTHMS: {
      if (getBoolean(raw.mash)) return `!${TWITCH_PLACEHOLDER} mash`;
      const actions = Array.isArray(raw.actions) ? raw.actions.map(asRecord) : [];
      return actions.length
        ? actions.map((action) => {
            const beeps = getNumber(action.beeps) ?? 0;
            return `!${TWITCH_PLACEHOLDER} press ${getString(action.button) ?? "unknown"}${beeps ? ` ${beeps}` : ""}`;
          }).join("; ")
        : `!${TWITCH_PLACEHOLDER} unknown`;
    }

    case ModuleType.COLOR_MATH: {
      const codes: Record<string, string> = { BLUE: "B", GREEN: "G", PURPLE: "P", YELLOW: "Y", WHITE: "W", MAGENTA: "M", RED: "R", ORANGE: "O", GRAY: "A", BLACK: "K" };
      const colors = getStringArray(raw.colors);
      return `!${TWITCH_PLACEHOLDER} set ${colors?.map((color) => codes[color] ?? color).join(",") ?? "unknown"}; !${TWITCH_PLACEHOLDER} submit`;
    }

    case ModuleType.ONLY_CONNECT: {
      const position = getNumber(raw.position);
      if (position) return `!${TWITCH_PLACEHOLDER} press ${position}`;
      const groups = Array.isArray(raw.groups) ? raw.groups.map(asRecord) : [];
      return groups.slice(0, 2).map((group) => `!${TWITCH_PLACEHOLDER} press ${getStringArray(group.letters)?.join(" ") ?? "unknown"}`).join("; ");
    }

    case ModuleType.CHORD_QUALITIES:
      return `!${TWITCH_PLACEHOLDER} submit ${getStringArray(raw.answerNotes)?.map((note) => note.replace("♯", "#")).join(" ") ?? "unknown"}`;

    case ModuleType.CREATION:
      return `!${TWITCH_PLACEHOLDER} combine ${getString(raw.first)?.toLowerCase() ?? "unknown"} ${getString(raw.second)?.toLowerCase() ?? "unknown"}`;

    case ModuleType.SEA_SHELLS:
      return `!${TWITCH_PLACEHOLDER} press ${getStringArray(raw.pressOrder)?.join(" ") ?? "unknown"}`;

    case ModuleType.ENGLISH_TEST:
      return `!${TWITCH_PLACEHOLDER} submit ${getString(raw.correctAnswer) ?? "unknown"}`;

    case ModuleType.TURN_THE_KEY: {
      const sec = (result as { turnWhenSeconds?: number }).turnWhenSeconds;
      const instr = (result as { instruction?: string }).instruction;
      if (instr) return `!${TWITCH_PLACEHOLDER} ${instr}`;
      if (typeof sec === "number") {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const ss = s < 10 ? "0" + s : String(s);
        return `!${TWITCH_PLACEHOLDER} turn when timer shows ${m}:${ss}`;
      }
      return `!${TWITCH_PLACEHOLDER} turn when timer shows time`;
    }

    case ModuleType.TURN_THE_KEYS: {
      const priority = (result as { priority?: number }).priority;
      if (typeof priority === "number") {
        return `!${TWITCH_PLACEHOLDER} Turn The Keys priority ${priority}`;
      }
      return `!${TWITCH_PLACEHOLDER} Turn The Keys`;
    }

    default:
      return `!${TWITCH_PLACEHOLDER} action ${getString(raw.action) ?? 'unknown'}`;
  }
}
