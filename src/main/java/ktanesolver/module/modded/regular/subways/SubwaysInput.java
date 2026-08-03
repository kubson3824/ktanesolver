package ktanesolver.module.modded.regular.subways;

import ktanesolver.logic.ModuleInput;

public record SubwaysInput(City city, Commuter commuter, Day day) implements ModuleInput {
	public enum City { NEW_YORK, LONDON, PARIS }
	public enum Commuter { BRYAN, JOHN, MIKE, EMILY, MARY, KATIE }
	public enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY }
}
