package ktanesolver.module.modded.regular.melodysequencer;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record MelodySequencerOutput(
    List<MelodySequencerMove> moves,
    List<MelodySequencerRecording> recordings
) implements ModuleOutput {}
