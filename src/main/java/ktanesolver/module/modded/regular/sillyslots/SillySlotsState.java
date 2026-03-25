package ktanesolver.module.modded.regular.sillyslots;

import java.util.List;

/**
 * Persisted state for Silly Slots: previous stages and history flags.
 */
public record SillySlotsState(
	List<Slot> previousStageSlots,
	List<Slot> twoStagesAgoSlots,
	boolean hadSoggySausageInAnyPreviousStage,
	boolean hadSassySausageInAnyPreviousStage,
	boolean lastStageHadSillySteven,
	boolean previousStageHadSausage,
	int leverPullCount
) {
	public SillySlotsState() {
		this(null, null, false, false, false, false, 0);
	}
}
