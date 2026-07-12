package ktanesolver.module.modded.regular.thebulb;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TheBulbOutput(List<String> actions, int continueFrom, String prompt) implements ModuleOutput {}
