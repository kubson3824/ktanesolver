package ktanesolver.module.modded.regular.jukebox;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record JukeboxInput(List<String> lyrics) implements ModuleInput {
}
