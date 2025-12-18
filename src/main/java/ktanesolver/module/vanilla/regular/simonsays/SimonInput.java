package ktanesolver.module.vanilla.regular.simonsays;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record SimonInput(List<SimonColor> flashes) implements ModuleInput {
}
