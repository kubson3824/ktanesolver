
package ktanesolver.module.vanilla.regular.whosonfirst;

import java.util.Map;

import ktanesolver.logic.ModuleInput;

public record WhosOnFirstInput(String displayWord, Map<ButtonPosition, String> buttons) implements ModuleInput {
}
