
package ktanesolver.module.vanilla.regular.button;

import ktanesolver.logic.ModuleInput;

public record ButtonInput(String color, String label, String stripColor // optional
) implements ModuleInput {
}
