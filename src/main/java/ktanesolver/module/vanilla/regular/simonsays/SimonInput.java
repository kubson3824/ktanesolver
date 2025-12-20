
package ktanesolver.module.vanilla.regular.simonsays;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SimonInput(List<SimonColor> flashes) implements ModuleInput {
}
