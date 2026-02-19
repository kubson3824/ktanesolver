package ktanesolver.module.modded.regular.cruelpianokeys;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.pianokeys.PianoKeysNote;

public record CruelPianoKeysOutput(List<PianoKeysNote> notes) implements ModuleOutput {
}
