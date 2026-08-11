package ktanesolver.module.modded.regular.scripting;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record ScriptingInput(List<String> usingPrograms, Integer intValue, Double floatValue, Boolean boolValue) implements ModuleInput {}
