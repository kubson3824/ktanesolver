package ktanesolver.module.modded.regular.extendedpassword;

import java.util.Map;
import java.util.Set;

import ktanesolver.logic.ModuleInput;

public record ExtendedPasswordInput(Map<Integer, Set<String>> letters) implements ModuleInput {
}
