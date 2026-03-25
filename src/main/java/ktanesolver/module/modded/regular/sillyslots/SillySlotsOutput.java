package ktanesolver.module.modded.regular.sillyslots;

import ktanesolver.logic.ModuleOutput;

public record SillySlotsOutput(boolean legal, Integer illegalRuleNumber) implements ModuleOutput {

	public SillySlotsOutput(boolean legal) {
		this(legal, null);
	}
}
