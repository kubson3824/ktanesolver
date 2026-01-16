
package ktanesolver.module.vanilla.regular.password;

import ktanesolver.logic.ModuleInput;

import java.util.Map;
import java.util.Set;

public record PasswordInput(Map<Integer, Set<Character>> letters) implements ModuleInput {
}
