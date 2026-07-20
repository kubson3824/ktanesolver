package ktanesolver.module.modded.regular.curriculum;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record CurriculumInput(List<ButtonSchedule> buttons) implements ModuleInput {
	public enum ClassPair {
		PHYSICS_MATHS("Physics", "Maths", 0),
		PHILOSOPHY_LITERATURE("Philosophy", "Literature", 1),
		PROGRAMMING_ECONOMY("Programming", "Economy", 2),
		LINGUISTICS_MANAGEMENT("Linguistics", "Management", 3),
		LOGIC_ELECTRONICS("Logic", "Electronics", 4);

		private final String firstClass;
		private final String secondClass;
		private final int serialPosition;

		ClassPair(String firstClass, String secondClass, int serialPosition) {
			this.firstClass = firstClass;
			this.secondClass = secondClass;
			this.serialPosition = serialPosition;
		}

		String className(int buttonState) {
			return buttonState < 3 ? firstClass : secondClass;
		}

		int serialPosition() {
			return serialPosition;
		}
	}

	public record ButtonSchedule(ClassPair classPair, List<List<Boolean>> sections, Integer currentSection) {}
}
