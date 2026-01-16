
package ktanesolver.module.modded.regular.colorflash;

import ktanesolver.logic.ModuleOutput;

public record ColorFlashOutput(boolean pressYes, boolean pressNo, String instruction, int position) implements ModuleOutput {
	public static ColorFlashOutput yes(String instruction, int position) {
		return new ColorFlashOutput(true, false, instruction, position);
	}

	public static ColorFlashOutput no(String instruction, int position) {
		return new ColorFlashOutput(false, true, instruction, position);
	}

	public static ColorFlashOutput no(String instruction) {
		return new ColorFlashOutput(false, true, instruction, -1);
	}
}
