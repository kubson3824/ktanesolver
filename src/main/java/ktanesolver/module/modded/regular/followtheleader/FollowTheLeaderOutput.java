package ktanesolver.module.modded.regular.followtheleader;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record FollowTheLeaderOutput(int startPlug, List<Integer> cutPlugs, String direction, boolean cutAllDescending) implements ModuleOutput {
}
