
package ktanesolver.module.vanilla.regular.simonstates;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record SimonStatesInput(
	int stage,
	SimonStatesColor topLeft,
	List<SimonStatesColor> flashes
) implements ModuleInput {}
