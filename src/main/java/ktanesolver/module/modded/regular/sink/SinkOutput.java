package ktanesolver.module.modded.regular.sink;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SinkOutput(List<Knob> sequence) implements ModuleOutput {
	public enum Knob { HOT, COLD }
}
