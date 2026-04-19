
package ktanesolver.module.modded.regular.pianokeys;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.shared.music.PianoKeysNote;

import java.util.List;

public record PianoKeysOutput(List<PianoKeysNote> notes) implements ModuleOutput {
}
