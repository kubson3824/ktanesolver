package ktanesolver.module.modded.regular.scripting;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ScriptingOutput(List<Boolean> usingNecessary, String variableType, String methodType, String action) implements ModuleOutput {}
