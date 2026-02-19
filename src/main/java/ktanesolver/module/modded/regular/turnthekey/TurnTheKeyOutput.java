package ktanesolver.module.modded.regular.turnthekey;

import ktanesolver.logic.ModuleOutput;

public record TurnTheKeyOutput(int turnWhenSeconds, String instruction) implements ModuleOutput {
}
