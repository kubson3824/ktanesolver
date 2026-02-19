package ktanesolver.module.modded.regular.adventuregame;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record AdventureGameInput(
	String enemy,
	int str,
	int dex,
	int intelligence,
	int heightFeet,
	int heightInches,
	double temperatureCelsius,
	double gravityMs2,
	double pressureKpa,
	List<String> weapons,
	List<String> miscItems,
	Boolean itemsAlreadyUsed,
	/** When true, Potion was used first; stats are post-Potion. Reevaluate other items and weapon with these stats. */
	Boolean potionUsedFirst
) implements ModuleInput {
}
