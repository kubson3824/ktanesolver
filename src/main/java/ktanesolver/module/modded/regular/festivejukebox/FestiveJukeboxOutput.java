package ktanesolver.module.modded.regular.festivejukebox;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record FestiveJukeboxOutput(
	String songTitle,
	String artist,
	List<Integer> positions,
	List<String> orderedWords
) implements ModuleOutput {}
