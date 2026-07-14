package ktanesolver.module.modded.regular.onlyconnect;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record OnlyConnectInput(int round, String teamName, List<String> hieroglyphs, List<String> letters) implements ModuleInput {}
