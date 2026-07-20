# Twitch Plays commands

KTANESolver converts solver results into complete commands for [KtaneTwitchPlays](https://github.com/samfundev/KtaneTwitchPlays).

## How commands are produced

1. A module receives a short Twitch selector, such as `wires` or `a1`.
2. The solver calculates an action.
3. `generateTwitchCommand` converts the typed result into the module's verified command grammar.
4. `TwitchCommandDisplay` prefixes the selector and presents each executable step separately.

Example:

```text
!wires cut 3
```

## Safety rules

- Generate only commands accepted by the module's `ProcessTwitchCommand` parser.
- Never emit `unknown`, guessed syntax, or prose instructions as a command.
- Return `undefined` until the current stage contains enough information.
- Keep sequential actions as `string[]` so users copy one complete command at a time.
- Preserve a combined command only when the module intentionally parses it as one submission.
- Regenerate the command after restoring a persisted solution.

{% hint style="warning" %}
Some modules cannot produce a safe command from the calculated answer alone. The UI asks for the missing physical position, timer value, or current stage instead of guessing.
{% endhint %}

## Stage-dependent modules

| Module | Additional context or behavior |
|---|---|
| Button | Produces `tap`, `hold`, or `release <digit>` for the current stage |
| Capacitor Discharge | Requires the intended hold duration |
| Colored Squares | Requires the physical A1–D4 coordinates |
| Coordinates | Emits one `submit <clue>` command per matching clue |
| English Test | Requires the physical answer position |
| Knobs | Emits a rotation only when the knob must move |
| Mouse in the Maze | Emits relative movement commands followed by `submit` |
| Plumbing | Requires the physical rotation list and explicit submit confirmation |
| Round Keypad | Uses physical positions rather than symbol names |
| Semaphore | Moves relative to the currently selected character, then presses OK |
| Square Button | Withholds a timed release when no exact timer value is known |
| Symbolic Password | Separates cycling from submission |
| The Bulb | Emits only the actions not yet performed |
| The Screw | Separates unscrew, screw, and press actions by stage |
| Turn the Keys | Emits only a key that is currently safe to turn |
| Venting Gas | Requires the answer for the active needy prompt |
| Word Search | Requires physical start and end coordinates |
| Yahtzee | Uses the current roll state: roll, keep, reroll, or done |

## Regression coverage

`ktanesolver-frontend/src/utils/twitchCommands.test.ts` contains an exact command fixture for every frontend `ModuleType`. The test also fails when a module is added without either a command fixture or an explicit support classification.

Run it with:

```bash
cd ktanesolver-frontend
npm run test -- src/utils/twitchCommands.test.ts
```

When adding or changing a command, verify the module's own parser or the external-module contract before updating the fixture. The parser is the source of truth, not the wording in the manual.
