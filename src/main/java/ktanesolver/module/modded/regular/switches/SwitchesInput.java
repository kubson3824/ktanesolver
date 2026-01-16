
package ktanesolver.module.modded.regular.switches;

import ktanesolver.logic.ModuleInput;

public record SwitchesInput(boolean[] currentSwitches, // Current state of 5 switches (true = up, false = down)
	boolean[] ledPositions // LED positions for each switch (true = top, false = bottom)
) implements ModuleInput {
}
