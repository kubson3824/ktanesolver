package ktanesolver.module.modded.regular.skyrim;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SkyrimInput(
	List<String> races,
	List<String> weapons,
	List<String> enemies,
	List<String> cities,
	List<String> dragonShouts
) implements ModuleInput {
}
