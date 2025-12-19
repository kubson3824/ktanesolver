package ktanesolver.module.vanilla.regular.whosonfirst;

import ktanesolver.logic.ModuleInput;

import java.util.Map;

public record WhosOnFirstInput(String displayWord, Map<ButtonPosition, String> buttons) implements ModuleInput {
}
