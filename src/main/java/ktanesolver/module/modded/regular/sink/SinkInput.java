package ktanesolver.module.modded.regular.sink;

import ktanesolver.logic.ModuleInput;

public record SinkInput(
	boolean goldPlatedKnobs,
	boolean stainlessSteelFaucet,
	boolean copperDrainPipe,
	boolean hasHdmiPort
) implements ModuleInput {}
