package ktanesolver.module.modded.regular.skyrim;

import ktanesolver.logic.ModuleOutput;

public record SkyrimOutput(
	String race,
	String weapon,
	String enemy,
	String city,
	String dragonShout
) implements ModuleOutput {
}
