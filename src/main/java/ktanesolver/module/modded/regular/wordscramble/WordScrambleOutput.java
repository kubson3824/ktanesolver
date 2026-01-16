
package ktanesolver.module.modded.regular.wordscramble;

import ktanesolver.logic.ModuleOutput;

public record WordScrambleOutput(boolean solved, String instruction, String solution) implements ModuleOutput {
}
