package ktanesolver.module.modded.regular.thirdbase;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.vanilla.regular.whosonfirst.ButtonPosition;

public record ThirdBaseOutput(ButtonPosition position, String buttonText) implements ModuleOutput {
}
