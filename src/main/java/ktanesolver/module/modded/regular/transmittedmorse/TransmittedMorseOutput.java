package ktanesolver.module.modded.regular.transmittedmorse;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TransmittedMorseOutput(int stage, String receivedMessage, String effectiveMessage, boolean reversed, List<Entry> entries, int nextStage) implements ModuleOutput {
	public record Entry(int slider, int position) {}
}
