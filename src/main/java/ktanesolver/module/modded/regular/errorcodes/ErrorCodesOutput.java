package ktanesolver.module.modded.regular.errorcodes;

import ktanesolver.logic.ModuleOutput;

public record ErrorCodesOutput(String activeErrorCode, int decimalFixCode, String format, String fixCode)
	implements ModuleOutput {
}
