package ktanesolver.module.modded.regular.festivepianokeys;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.shared.music.PianoKeysNote;

public record FestivePianoKeysOutput(List<PianoKeysNote> notes) implements ModuleOutput {
}
