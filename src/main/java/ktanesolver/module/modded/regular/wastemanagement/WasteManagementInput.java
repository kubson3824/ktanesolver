package ktanesolver.module.modded.regular.wastemanagement;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record WasteManagementInput(TimerBand timerBand, List<String> additionalModuleNames) implements ModuleInput {
	public enum TimerBand {
		MORE_THAN_HALF,
		HALF_OR_LESS,
		LAST_FIFTH
	}
}
