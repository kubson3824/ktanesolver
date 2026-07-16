package ktanesolver.module.modded.regular.sillyslots;

import java.util.ArrayList;
import java.util.List;

public record SillySlotsState(
	int leverPullCount,
	List<List<String>> displayHistory
) {
	public SillySlotsState() {
		this(0, new ArrayList<>());
	}
}
