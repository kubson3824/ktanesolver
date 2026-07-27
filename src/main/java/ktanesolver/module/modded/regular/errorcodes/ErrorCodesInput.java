package ktanesolver.module.modded.regular.errorcodes;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ErrorCodesInput(List<String> errorCodes) implements ModuleInput {
}
