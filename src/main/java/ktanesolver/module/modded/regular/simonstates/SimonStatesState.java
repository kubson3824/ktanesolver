
package ktanesolver.module.modded.regular.simonstates;

import java.util.List;

public record SimonStatesState(
	List<SimonStatesColor> pressHistory,
	SimonStatesColor topLeft
) {}
