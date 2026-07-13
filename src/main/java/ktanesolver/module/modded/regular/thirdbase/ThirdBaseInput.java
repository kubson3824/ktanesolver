package ktanesolver.module.modded.regular.thirdbase;

import java.util.Map;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.vanilla.regular.whosonfirst.ButtonPosition;

public record ThirdBaseInput(String displayWord, Map<ButtonPosition, String> buttons) implements ModuleInput {
}
