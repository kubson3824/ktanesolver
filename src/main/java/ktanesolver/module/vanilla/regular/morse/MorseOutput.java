
package ktanesolver.module.vanilla.regular.morse;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MorseOutput(List<MorseCandidate> candidates, boolean resolved) implements ModuleOutput {
}
