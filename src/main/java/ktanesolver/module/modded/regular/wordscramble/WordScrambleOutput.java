package ktanesolver.module.modded.regular.wordscramble;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import ktanesolver.logic.ModuleOutput;

public record WordScrambleOutput(boolean solved, String instruction, String solution) implements ModuleOutput {
}
