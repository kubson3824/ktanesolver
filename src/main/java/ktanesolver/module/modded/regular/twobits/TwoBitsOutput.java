
package ktanesolver.module.modded.regular.twobits;

import ktanesolver.logic.ModuleOutput;

import java.util.List;

public record TwoBitsOutput(String letters, List<TwoBitsStage> stages) implements ModuleOutput {
}
