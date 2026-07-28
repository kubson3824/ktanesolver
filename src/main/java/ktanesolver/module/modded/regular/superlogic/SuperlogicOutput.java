package ktanesolver.module.modded.regular.superlogic;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SuperlogicOutput(List<Boolean> values) implements ModuleOutput {
}
