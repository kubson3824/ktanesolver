import { ModuleType } from "../types";

export interface TwitchCommandData {
  moduleType: ModuleType;
  result: any;
  moduleNumber: number;
}

export function generateTwitchCommand(data: TwitchCommandData): string {
  const { moduleType, result, moduleNumber } = data;
  
  switch (moduleType) {
    case ModuleType.WIRES:
      return `!${moduleNumber} cut ${result.wirePosition + 1}`;
    
    case ModuleType.BUTTON:
      if (result.hold) {
        return `!${moduleNumber} hold`;
      } else {
        return `!${moduleNumber} press`;
      }
    
    case ModuleType.MEMORY:
      return `!${moduleNumber} press ${result.position}`;
    
    case ModuleType.KEYPADS:
      // Assuming result has the button to press - convert position to TL TR BL BR format
      if (result.position) {
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
        const position = positionMap[result.position.toString().toUpperCase()] || result.position;
        return `!${moduleNumber} press ${position}`;
      }
      // Fallback to label if position not available
      return `!${moduleNumber} press ${result.label || result.button || 'unknown'}`;
    
    case ModuleType.SIMON_SAYS:
      // Assuming result has the sequence or color to press
      if (result.sequence) {
        return `!${moduleNumber} sequence ${result.sequence.join(' ')}`;
      } else {
        return `!${moduleNumber} press ${result.color}`;
      }
    
    case ModuleType.MORSE_CODE:
      // Assuming result has the word to transmit
      return `!${moduleNumber} transmit ${result.word}`;
    
    case ModuleType.FORGET_ME_NOT:
      // Assuming result has the action and parameter
      if (result.action === 'display') {
        return `!${moduleNumber} display ${result.value}`;
      } else if (result.action === 'press') {
        return `!${moduleNumber} press ${result.label}`;
      }
      return `!${moduleNumber} ${result.action}`;
    
    case ModuleType.WHOS_ON_FIRST:
      // Assuming result has the button to press
      return `!${moduleNumber} press ${result.button}`;
    
    case ModuleType.VENTING_GAS:
      // Assuming result has the action
      return `!${moduleNumber} ${result.action}`;
    
    case ModuleType.CAPACITOR_DISCHARGE:
      // Assuming result has the action
      return `!${moduleNumber} ${result.action}`;
    
    case ModuleType.COMPLICATED_WIRES:
      return `!${moduleNumber} cut ${result.wire}`;
    
    case ModuleType.WIRE_SEQUENCES:
      // Assuming result has the wire to cut
      return `!${moduleNumber} cut ${result.wirePosition}`;
    
    case ModuleType.PASSWORDS:
      // Assuming result has the password
      return `!${moduleNumber} submit ${result.password}`;
    
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
        return `!${moduleNumber} ${directionLetters.join(' ')}`;
      }
      return `!${moduleNumber} ${result.action || 'unknown'}`;
    
    case ModuleType.EMOJI_MATH:
      return `!${moduleNumber} answer ${result.answer}`;
    
    case ModuleType.SWITCHES:
      // For switches, we'll provide the instruction as is
      return `!${moduleNumber} ${result.instruction}`;
    
    case ModuleType.TWO_BITS:
      // For Two Bits, we provide the letters to display
      return `!${moduleNumber} display ${result.letters}`;
    
    case ModuleType.WORD_SCRAMBLE:
      // For Word Scramble, we provide the solution word
      return `!${moduleNumber} word ${result.solution || 'unknown'}`;
    
    default:
      return `!${moduleNumber} action ${result.action || 'unknown'}`;
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
    [ModuleType.EMOJI_MATH]: "Emoji Math",
    [ModuleType.SWITCHES]: "Switches",
    [ModuleType.TWO_BITS]: "Two Bits",
    [ModuleType.WORD_SCRAMBLE]: "Word Scramble",
  };
  
  return displayNames[moduleType] || moduleType;
}
