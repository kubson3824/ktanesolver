
package ktanesolver.module.vanilla.regular.password;

import ktanesolver.logic.ModuleOutput;

import java.util.List;

public record PasswordOutput(List<String> possibleWords, boolean resolved) implements ModuleOutput {
}
