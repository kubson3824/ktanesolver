package ktanesolver.module.modded.regular.partytime;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record PartyTimeInput(List<SpaceType> spaces) implements ModuleInput {
	public enum SpaceType { START, NORMAL, D_BATTERY, AA_BATTERY, INDICATOR, WATER, FIRE, GOAL }
}
