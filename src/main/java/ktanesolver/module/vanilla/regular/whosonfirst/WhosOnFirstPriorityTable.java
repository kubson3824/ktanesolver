
package ktanesolver.module.vanilla.regular.whosonfirst;

import java.util.List;
import java.util.Map;

public final class WhosOnFirstPriorityTable {

	public static final Map<String, List<String>> PRIORITY_MAP = Map.ofEntries(
		Map.entry("BLANK", List.of("WAIT", "RIGHT", "OKAY", "MIDDLE", "BLANK")), Map.entry("DONE", List.of("SURE", "UH HUH", "NEXT", "WHAT?", "YOUR", "UR", "YOU'RE", "HOLD")),
		Map.entry("FIRST", List.of("LEFT", "OKAY", "YES", "MIDDLE", "NO", "RIGHT", "NOTHING", "UHHH", "WAIT")),
		Map.entry("HOLD", List.of("YOU ARE", "U", "DONE", "UH UH", "YOU", "UR", "SURE", "WHAT?", "YOU'RE")), Map.entry("LEFT", List.of("RIGHT", "LEFT")),
		Map.entry("LIKE", List.of("YOU'RE", "NEXT", "U", "UR", "HOLD", "DONE", "UH UH", "WHAT?", "UH HUH")),
		Map.entry("MIDDLE", List.of("BLANK", "READY", "OKAY", "WHAT", "NOTHING", "PRESS", "NO", "WAIT", "LEFT")),
		Map.entry("NEXT", List.of("WHAT?", "UH HUH", "UH UH", "YOUR", "HOLD", "SURE", "NEXT")), Map.entry("NO", List.of("BLANK", "UHHH", "WAIT", "FIRST", "WHAT", "READY", "RIGHT", "YES", "NOTHING")),
		Map.entry("NOTHING", List.of("UHHH", "RIGHT", "OKAY", "MIDDLE", "YES", "BLANK", "NO", "PRESS", "LEFT")),
		Map.entry("OKAY", List.of("MIDDLE", "NO", "FIRST", "YES", "UHHH", "NOTHING", "WAIT", "OKAY")), Map.entry("PRESS", List.of("RIGHT", "MIDDLE", "YES", "READY", "PRESS")),
		Map.entry("READY", List.of("YES", "OKAY", "WHAT", "MIDDLE", "LEFT", "PRESS", "RIGHT", "BLANK", "READY")),
		Map.entry("RIGHT", List.of("YES", "NOTHING", "READY", "PRESS", "NO", "WAIT", "WHAT", "RIGHT")),
		Map.entry("SURE", List.of("YOU ARE", "DONE", "LIKE", "YOU'RE", "YOU", "HOLD", "UH HUH", "UR", "SURE")),
		Map.entry("U", List.of("UH HUH", "SURE", "NEXT", "WHAT?", "YOU'RE", "UR", "UH UH", "DONE", "U")),
		Map.entry("UHHH", List.of("READY", "NOTHING", "LEFT", "WHAT", "OKAY", "YES", "RIGHT", "NO", "PRESS")), Map.entry("UH HUH", List.of("UH HUH")),
		Map.entry("UH UH", List.of("UR", "U", "YOU ARE", "YOU'RE", "NEXT", "UH UH")), Map.entry("UR", List.of("DONE", "U", "UR")),
		Map.entry("WAIT", List.of("UHHH", "NO", "BLANK", "OKAY", "YES", "LEFT", "FIRST", "PRESS", "WHAT")), Map.entry("WHAT", List.of("UHHH", "WHAT")),
		Map.entry("WHAT?", List.of("YOU", "HOLD", "YOU'RE", "YOUR", "U", "DONE", "UH UH", "LIKE", "YOU ARE")),
		Map.entry("YES", List.of("OKAY", "RIGHT", "UHHH", "MIDDLE", "FIRST", "WHAT", "PRESS", "READY", "NOTHING")),
		Map.entry("YOU", List.of("SURE", "YOU ARE", "YOUR", "YOU'RE", "NEXT", "UH HUH", "UR", "HOLD", "WHAT?")), Map.entry("YOU'RE", List.of("YOU", "YOU'RE")),
		Map.entry("YOU ARE", List.of("YOUR", "NEXT", "LIKE", "UH HUH", "WHAT?", "DONE", "UH UH", "HOLD", "YOU")), Map.entry("YOUR", List.of("UH UH", "YOU ARE", "UH HUH", "YOUR")));

	private WhosOnFirstPriorityTable() {
	}
}
