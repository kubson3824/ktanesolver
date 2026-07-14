package ktanesolver.module.modded.regular.onlyconnect;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record OnlyConnectOutput(
	int round,
	String hieroglyph,
	Integer position,
	List<Group> groups
) implements ModuleOutput {
	public record Group(String language, List<String> letters) {}
}
