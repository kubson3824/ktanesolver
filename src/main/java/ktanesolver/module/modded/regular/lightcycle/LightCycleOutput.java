package ktanesolver.module.modded.regular.lightcycle;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record LightCycleOutput(List<String> sequence) implements ModuleOutput {
}
