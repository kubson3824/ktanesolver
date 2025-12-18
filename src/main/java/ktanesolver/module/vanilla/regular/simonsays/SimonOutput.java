package ktanesolver.module.vanilla.regular.simonsays;

import ktanesolver.logic.ModuleOutput;

import java.util.List;

public record SimonOutput(List<SimonColor> presses) implements ModuleOutput {
}
