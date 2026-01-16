
package ktanesolver.module.modded.regular.pianokeys;

import ktanesolver.logic.ModuleOutput;

import java.util.List;

public record PianoKeysOutput(List<PianoKeysNote> notes) implements ModuleOutput {
}
