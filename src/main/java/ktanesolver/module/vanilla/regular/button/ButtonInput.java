
package ktanesolver.module.vanilla.regular.button;

import ktanesolver.logic.ModuleInput;

public record ButtonInput(String color, String label, String stripColor, String language) implements ModuleInput {
	public ButtonInput(String color, String label, String stripColor) {
		this(color, label, stripColor, "EN");
	}
}
