
package ktanesolver.module.modded.regular.connectioncheck;

import ktanesolver.logic.ModuleOutput;

public record ConnectionCheckOutput(boolean led1, boolean led2, boolean led3, boolean led4) implements ModuleOutput {
}
