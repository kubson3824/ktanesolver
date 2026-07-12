package ktanesolver.module.modded.regular.friendship;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record FriendshipInput(List<FriendshipSymbol> symbols, List<String> displayedElements) implements ModuleInput {}
