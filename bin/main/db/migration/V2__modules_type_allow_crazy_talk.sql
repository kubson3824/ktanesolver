-- Allow CRAZY_TALK (and ensure all current ModuleType enum values) in modules.type check constraint.
-- Required when adding a new module type; Hibernate ddl-auto=update does not alter existing check constraints.
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_type_check;

ALTER TABLE modules ADD CONSTRAINT modules_type_check CHECK (type IN (
    'ANAGRAMS', 'ASTROLOGY', 'BUTTON', 'CAPACITOR_DISCHARGE', 'COLOR_FLASH',
    'COMBINATION_LOCK', 'COMPLICATED_WIRES', 'CONNECTION_CHECK', 'CRAZY_TALK',
    'EMOJI_MATH', 'FORGET_ME_NOT', 'FOREIGN_EXCHANGE_RATES', 'KEYPADS', 'KNOBS',
    'LETTER_KEYS', 'LISTENING', 'LOGIC', 'MATH', 'MAZES', 'MEMORY', 'MORSE_CODE',
    'MORSEMATICS', 'MYSTIC_SQUARE', 'ORIENTATION_CUBE', 'PASSWORDS', 'PIANO_KEYS',
    'ROUND_KEYPAD', 'SEMAPHORE', 'SIMON_SAYS', 'SWITCHES', 'TWO_BITS',
    'VENTING_GAS', 'WIRE_SEQUENCES', 'WIRES', 'WORD_SCRAMBLE', 'WHOS_ON_FIRST'
));
