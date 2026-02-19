package ktanesolver.module.modded.regular.adventuregame;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record AdventureGameOutput(
	List<String> itemsToUse,
	String weaponToUse
) implements ModuleOutput {
}
