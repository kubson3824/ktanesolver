package ktanesolver.module.modded.regular.thecube;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record TheCubeInput(
	List<Rotation> rotations,
	List<Integer> faces,
	List<Color> wires,
	List<Button> buttons,
	Button executeButton,
	String cipherTwo,
	String cipherThree
) implements ModuleInput {
	public enum Rotation {
		ROTATE_CLOCKWISE("rotate clockwise"),
		TIP_LEFT("tip left"),
		TIP_BACKWARDS("tip backwards"),
		ROTATE_COUNTERCLOCKWISE("rotate counterclockwise"),
		TIP_RIGHT("tip right"),
		TIP_FORWARDS("tip forwards");

		private final String displayName;

		Rotation(String displayName) {
			this.displayName = displayName;
		}

		public String displayName() {
			return displayName;
		}
	}

	public enum Color {
		BLUE, GREEN, ORANGE, PURPLE, RED, WHITE
	}

	public record Button(Color color, String label) {}
}
