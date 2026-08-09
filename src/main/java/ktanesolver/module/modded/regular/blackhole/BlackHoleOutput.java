package ktanesolver.module.modded.regular.blackhole;

import ktanesolver.logic.ModuleOutput;

public record BlackHoleOutput(
	int digit,
	int enteredGlobally,
	int expectedGlobally,
	int enteredHere,
	int expectedHere,
	boolean shortened
) implements ModuleOutput {}
