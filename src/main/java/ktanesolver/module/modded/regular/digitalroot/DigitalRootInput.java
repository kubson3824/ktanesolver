package ktanesolver.module.modded.regular.digitalroot;

import ktanesolver.logic.ModuleInput;

public record DigitalRootInput(
	Integer first,
	Integer second,
	Integer third,
	Integer displayedRoot
) implements ModuleInput {}
