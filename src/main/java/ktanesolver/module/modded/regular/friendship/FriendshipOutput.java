package ktanesolver.module.modded.regular.friendship;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record FriendshipOutput(String element, List<String> possibleElements) implements ModuleOutput {}
