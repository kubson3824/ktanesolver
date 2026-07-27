package ktanesolver.module.modded.regular.fontselect;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record FontSelectOutput(String targetFont, List<String> actions) implements ModuleOutput {
}
