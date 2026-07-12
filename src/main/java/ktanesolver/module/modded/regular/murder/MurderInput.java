package ktanesolver.module.modded.regular.murder;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MurderInput(Location bodyLocation, List<Suspect> suspects, List<Weapon> weapons) implements ModuleInput {
	public enum Suspect {
		MISS_SCARLETT, PROFESSOR_PLUM, MRS_PEACOCK, REVEREND_GREEN, COLONEL_MUSTARD, MRS_WHITE
	}

	public enum Weapon {
		CANDLESTICK, DAGGER, LEAD_PIPE, REVOLVER, ROPE, SPANNER
	}

	public enum Location {
		DINING_ROOM, STUDY, KITCHEN, LOUNGE, BILLIARD_ROOM, CONSERVATORY, BALLROOM, HALL, LIBRARY
	}
}
