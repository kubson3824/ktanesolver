package ktanesolver.module.modded.regular.jukebox;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record JukeboxOutput(String songTitle, List<Integer> pressPositions) implements ModuleOutput {
}
