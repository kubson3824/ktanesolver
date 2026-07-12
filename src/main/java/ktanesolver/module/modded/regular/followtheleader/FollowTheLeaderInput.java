package ktanesolver.module.modded.regular.followtheleader;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record FollowTheLeaderInput(List<WireColor> wiresByPlug) implements ModuleInput {
	public enum WireColor { RED, GREEN, WHITE, YELLOW, BLUE, BLACK }
}
