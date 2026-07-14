package ktanesolver.module.modded.regular.lightcycle;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LightCycleInput(List<String> initialColors) implements ModuleInput {
}
