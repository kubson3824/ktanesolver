package ktanesolver.module.modded.regular.tapcode;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TapCodeOutput(String solutionWord, List<String> tapCode) implements ModuleOutput {
}
