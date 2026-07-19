# Twitch Plays command audit

Audited on 2026-07-19 against the command parsers in
[KtaneTwitchPlays](https://github.com/samfundev/KtaneTwitchPlays) and the modules' own
`ProcessTwitchCommand` implementations. Twitch Plays' external-module contract documents that
method as the authoritative command grammar:
[External Mod Module Support](https://github-wiki-see.page/m/samfundev/KtaneTwitchPlays/wiki/External-Mod-Module-Support).

## Result

All 110 frontend `ModuleType` values have an exact regression fixture in
`src/utils/twitchCommands.test.ts`. The matrix verifies the complete generated string, not just
that a string exists. It also fails when a module is added without an audit fixture or support
classification.

- 92 modules produce a directly executable command.
- 18 modules produce a command only when the current interaction stage or a small manual Twitch
  field contains enough data.
- No module is left without a safe Twitch command path.
- No generator path emits `unknown`, prose instructions, or a guessed command.

## Directly verified modules (92)

`WIRES`, `KEYPADS`, `MEMORY`, `SIMON_SAYS`, `MORSE_CODE`, `FORGET_ME_NOT`, `SOUVENIR`,
`ICE_CREAM`, `X_RAY`, `BATTLESHIP`, `MINESWEEPER`, `WHOS_ON_FIRST`, `THIRD_BASE`,
`COMPLICATED_WIRES`, `WIRE_SEQUENCES`, `PASSWORDS`, `MAZES`, `COLOR_FLASH`, `PIANO_KEYS`,
`PERSPECTIVE_PEGS`, `EMOJI_MATH`, `SWITCHES`, `TWO_BITS`, `WORD_SCRAMBLE`, `BROKEN_BUTTONS`,
`COMPLICATED_BUTTONS`, `ANAGRAMS`, `COMBINATION_LOCK`, `LISTENING`,
`FOREIGN_EXCHANGE_RATES`, `NUMBER_PAD`, `ORIENTATION_CUBE`, `MORSEMATICS`, `CONNECTION_CHECK`,
`LETTER_KEYS`, `LOGIC`, `ASTROLOGY`, `MYSTIC_SQUARE`, `CRAZY_TALK`, `ADVENTURE_GAME`,
`CRUEL_PIANO_KEYS`, `SAFETY_SAFE`, `CRYPTOGRAPHY`, `CAESAR_CIPHER`, `TURN_THE_KEY`, `CHESS`,
`HEXAMAZE`, `BITMAPS`, `ADJACENT_LETTERS`, `SILLY_SLOTS`, `SKEWED_SLOTS`, `THREE_D_MAZE`,
`SIMON_STATES`, `SIMON_SCREAMS`, `MODULES_AGAINST_HUMANITY`, `LAUNDRY`, `PROBING`, `ALPHABET`,
`MICROCONTROLLER`, `MURDER`, `RESISTORS`, `GAMEPAD`, `TIC_TAC_TOE`, `MONSPLODE_FIGHT`, `SHAPE_SHIFT`,
`FOLLOW_THE_LEADER`, `FRIENDSHIP`, `BLIND_ALLEY`, `SEA_SHELLS`,
`ROCK_PAPER_SCISSORS_LIZARD_SPOCK`, `TEXT_FIELD`, `WIRE_PLACEMENT`, `DOUBLE_OH`,
`CHEAP_CHECKOUT`, `LIGHT_CYCLE`, `BINARY_LEDS`, `RHYTHMS`, `COLOR_MATH`, `ONLY_CONNECT`,
`NEUTRALIZATION`, `WEB_DESIGN`, `CHORD_QUALITIES`, `CREATION`, `RUBIKS_CUBE`, `FIZZ_BUZZ`,
`THE_CLOCK`, `LED_ENCRYPTION`, `BITWISE_OPERATIONS`, `FAST_MATH`, `BOOLEAN_VENN_DIAGRAM`, `ZOO`,
and `POINT_OF_ORDER`.

## Stage-dependent or manually completed modules (18)

| Module | Safe behavior |
|---|---|
| `BUTTON` | Returns `tap`, `hold`, or `release <digit>` according to the current stage. |
| `CAPACITOR_DISCHARGE` | Uses the manually entered hold duration. |
| `COLORED_SQUARES` | Uses the manually entered A1–D4 coordinates for the group returned by the solver. |
| `COORDINATES` | Returns one `submit <clue>` command per matching clue. |
| `ENGLISH_TEST` | Uses the manually selected 1–4 position of the returned answer text. |
| `KNOBS` | Returns a rotation only when the knob needs turning; `UP` needs no command. |
| `MOUSE_IN_THE_MAZE` | Returns relative moves followed by a separate `submit`. |
| `PLUMBING` | Uses the manually entered A1–F6 rotation list and requires explicit submit confirmation. |
| `ROUND_KEYPAD` | Uses physical positions 1–8 supplied by the solver UI, not symbol names. |
| `SEMAPHORE` | Moves relative to the manually selected current character, then presses OK. |
| `SQUARE_BUTTON` | Returns `tap` or `hold`; timed release prose is withheld when no exact timer value is known. |
| `SYMBOLIC_PASSWORD` | Returns `cycle ...` and a separate `submit` command. |
| `THE_BULB` | Returns only the not-yet-performed action segment. |
| `THE_SCREW` | Returns the stage's `unscrew`, `screw <hole>`, and `press <label>` commands separately. |
| `TURN_THE_KEYS` | Returns only a key that is currently allowed to turn. |
| `VENTING_GAS` | Uses the manually selected YES/NO response for the active needy prompt. |
| `WORD_SEARCH` | Uses the manually entered A1–F6 start and end coordinates. |
| `YAHTZEE` | Returns the command for the current roll state (`roll`, `keep`, `reroll`, or `done`). |

## Shared display behavior

`TwitchCommandDisplay` now prefixes legacy bare commands with the selected module code and splits
every semicolon-separated step before copying. This keeps existing per-module helpers compatible
while ensuring each pasted line is a complete `!<module> ...` command.
