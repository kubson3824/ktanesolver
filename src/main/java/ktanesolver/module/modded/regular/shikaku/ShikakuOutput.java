package ktanesolver.module.modded.regular.shikaku;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ShikakuOutput(List<Region> regions, List<String> presses) implements ModuleOutput {
	public record Region(String clue, String correctHint, List<String> cells) {}
}
