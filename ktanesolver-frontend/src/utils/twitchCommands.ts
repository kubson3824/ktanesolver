import { ModuleType } from "../types";

export interface TwitchCommandData {
  moduleType: ModuleType;
  result: unknown;
}

const TWITCH_PLACEHOLDER = "number";

export function generateTwitchCommand(data: TwitchCommandData): string {
  const { moduleType, result } = data;
  
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
      // Assuming result has the action and parameter
      if (result.action === 'display') {
        return `!${TWITCH_PLACEHOLDER} display ${result.value}`;
      } else if (result.action === 'press') {
        return `!${TWITCH_PLACEHOLDER} press ${result.label}`;
      }
      return `!${TWITCH_PLACEHOLDER} ${result.action}`;
    
    case ModuleType.WHOS_ON_FIRST:
      // Assuming result has the button to press
      return `!${TWITCH_PLACEHOLDER} press ${result.button}`;
    
    case ModuleType.VENTING_GAS:
      // Assuming result has the action
      return `!${TWITCH_PLACEHOLDER} ${result.action}`;
    
    case ModuleType.CAPACITOR_DISCHARGE:
      // Assuming result has the action
      return `!${TWITCH_PLACEHOLDER} ${result.action}`;
    
    case ModuleType.COMPLICATED_WIRES:
      return `!${TWITCH_PLACEHOLDER} cut ${result.wire}`;
    
    case ModuleType.WIRE_SEQUENCES:
      // Assuming result has the wire to cut
      return `!${TWITCH_PLACEHOLDER} cut ${result.wirePosition}`;
    
    case ModuleType.PASSWORDS:
      // Assuming result has the password
      return `!${TWITCH_PLACEHOLDER} submit ${result.password}`;
    
    case ModuleType.MAZES:
      // Assuming result has the directions - convert to first letters
      if (result.directions) {
        const directionLetters = result.directions.map((dir: string) => {
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
          return directionMap[dir.toUpperCase()] || dir;
        });
        return `!${TWITCH_PLACEHOLDER} ${directionLetters.join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} ${result.action || 'unknown'}`;
    
    case ModuleType.EMOJI_MATH:
      return `!${TWITCH_PLACEHOLDER} answer ${result.answer}`;
    
    case ModuleType.SWITCHES:
      // For switches, we'll provide the instruction as is
      return `!${TWITCH_PLACEHOLDER} ${result.instruction}`;
    
    case ModuleType.TWO_BITS:
      // For Two Bits, we provide the letters to display
      return `!${TWITCH_PLACEHOLDER} display ${result.letters}`;
    
    case ModuleType.WORD_SCRAMBLE:
      // For Word Scramble, we provide the solution word
      return `!${TWITCH_PLACEHOLDER} word ${result.solution || 'unknown'}`;
    
    case ModuleType.ANAGRAMS:
      // For Anagrams, we provide the possible solutions
      if (result.possibleSolutions && result.possibleSolutions.length > 0) {
        return `!${TWITCH_PLACEHOLDER} anagrams ${result.possibleSolutions.join(', ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} anagrams no solution`;
    
    case ModuleType.COMBINATION_LOCK:
      // For Combination Lock, we provide the combination numbers
      if (result.combination && Array.isArray(result.combination)) {
        return `!${TWITCH_PLACEHOLDER} combo ${result.combination.join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} combo ${result.firstNumber || '0'} ${result.secondNumber || '0'} ${result.thirdNumber || '0'}`;
    
    case ModuleType.ROUND_KEYPAD:
      // For Round Keypad, we provide the symbols to press
      if (result.symbolsToPress && Array.isArray(result.symbolsToPress)) {
        return `!${TWITCH_PLACEHOLDER} press ${result.symbolsToPress.join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} press none`;
    
    case ModuleType.LISTENING:
      // For Listening, we provide the 4-symbol code to enter
      if (result.code) {
        return `!${TWITCH_PLACEHOLDER} code ${result.code}`;
      }
      return `!${TWITCH_PLACEHOLDER} code unknown`;

    case ModuleType.FOREIGN_EXCHANGE_RATES:
      // For Foreign Exchange, we provide the key position
      return `!${TWITCH_PLACEHOLDER} key ${result.keyPosition}`;

    case ModuleType.ORIENTATION_CUBE:
      // For Orientation Cube, we provide the rotation sequence
      if (result.rotations && Array.isArray(result.rotations)) {
        const rotationMap: Record<string, string> = {
          'ROTATE_LEFT': 'L',
          'ROTATE_RIGHT': 'R',
          'ROTATE_CLOCKWISE': 'CW',
          'ROTATE_COUNTERCLOCKWISE': 'CCW'
        };
        const rotations = result.rotations.map((rot: string) => rotationMap[rot] || rot).join(' ');
        return `!${TWITCH_PLACEHOLDER} rotate ${rotations}`;
      }
      return `!${TWITCH_PLACEHOLDER} rotate unknown`;

    case ModuleType.LETTER_KEYS:
      // For Letter Keys, we provide the letter to press
      return `!${TWITCH_PLACEHOLDER} press ${result.letter}`;

    case ModuleType.ASTROLOGY:
      // For Astrology, we provide the computed omen score
      return `!${TWITCH_PLACEHOLDER} omen ${result.omenScore}`;

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
      return `!${TWITCH_PLACEHOLDER} action ${result.action || 'unknown'}`;
  }
}

export function getModuleDisplayName(moduleType: ModuleType): string {
  const displayNames: Record<ModuleType, string> = {
    [ModuleType.WIRES]: "Wires",
    [ModuleType.BUTTON]: "Button",
    [ModuleType.KEYPADS]: "Keypads",
    [ModuleType.MEMORY]: "Memory",
    [ModuleType.SIMON_SAYS]: "Simon Says",
    [ModuleType.MORSE_CODE]: "Morse Code",
    [ModuleType.FORGET_ME_NOT]: "Forget Me Not",
    [ModuleType.WHOS_ON_FIRST]: "Who's on First",
    [ModuleType.VENTING_GAS]: "Venting Gas",
    [ModuleType.CAPACITOR_DISCHARGE]: "Capacitor Discharge",
    [ModuleType.COMPLICATED_WIRES]: "Complicated Wires",
    [ModuleType.WIRE_SEQUENCES]: "Wire Sequences",
    [ModuleType.PASSWORDS]: "Passwords",
    [ModuleType.MAZES]: "Mazes",
    [ModuleType.KNOBS]: "Knobs",
    [ModuleType.COLOR_FLASH]: "Color Flash",
    [ModuleType.PIANO_KEYS]: "Piano Keys",
    [ModuleType.SEMAPHORE]: "Semaphore",
    [ModuleType.MATH]: "Math",
    [ModuleType.EMOJI_MATH]: "Emoji Math",
    [ModuleType.SWITCHES]: "Switches",
    [ModuleType.TWO_BITS]: "Two Bits",
    [ModuleType.WORD_SCRAMBLE]: "Word Scramble",
    [ModuleType.ANAGRAMS]: "Anagrams",
    [ModuleType.COMBINATION_LOCK]: "Combination Lock",
    [ModuleType.ROUND_KEYPAD]: "Round Keypad",
    [ModuleType.LISTENING]: "Listening",
    [ModuleType.FOREIGN_EXCHANGE_RATES]: "Foreign Exchange Rates",
    [ModuleType.ORIENTATION_CUBE]: "Orientation Cube",
    [ModuleType.MORSEMATICS]: "Morsematics",
    [ModuleType.LETTER_KEYS]: "Letter Keys",
    [ModuleType.LOGIC]: "Logic",
    [ModuleType.ASTROLOGY]: "Astrology",
    [ModuleType.CONNECTION_CHECK]: "Connection Check",
    [ModuleType.MYSTIC_SQUARE]: "Mystic Square",
    [ModuleType.CRAZY_TALK]: "Crazy Talk",
    [ModuleType.ADVENTURE_GAME]: "Adventure Game",
    [ModuleType.PLUMBING]: "Plumbing",
    [ModuleType.CRUEL_PIANO_KEYS]: "Cruel Piano Keys",
    [ModuleType.SAFETY_SAFE]: "Safety Safe",
    [ModuleType.CRYPTOGRAPHY]: "Cryptography",
    [ModuleType.TURN_THE_KEY]: "Turn The Key",
    [ModuleType.TURN_THE_KEYS]: "Turn The Keys",
    [ModuleType.CHESS]: "Chess",
    [ModuleType.MOUSE_IN_THE_MAZE]: "Mouse In The Maze",
  };

  return displayNames[moduleType] || moduleType;
}
