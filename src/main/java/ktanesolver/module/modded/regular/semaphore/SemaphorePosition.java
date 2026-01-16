
package ktanesolver.module.modded.regular.semaphore;

import lombok.Getter;

@Getter
public enum SemaphorePosition {
	// Control characters
	NUMERALS(0, 45, '§'), LETTERS(0, 90, '§'),
	// Merged positions (angles, letter, number)
	A_1(225, 180, 'A', '1'), B_2(270, 180, 'B', '2'), C_3(315, 180, 'C', '3'), D_4(0, 180, 'D', '4'), E_5(180, 45, 'E', '5'), F_6(180, 90, 'F', '6'), G_7(180, 135, 'G', '7'), H_8(270, 225, 'H',
		'8'), I_9(315, 225, 'I', '9'), K_0(225, 0, 'K', '0'),
	// Letters only
	J(0, 90, 'J'), L(225, 45, 'L'), M(225, 90, 'M'), N(225, 135, 'N'), O(270, 315, 'O'), P(270, 0, 'P'), Q(270, 45, 'Q'), R(270, 90, 'R'), S(270, 135, 'S'), T(315, 0, 'T'), U(315, 45, 'U'), V(0, 135,
		'V'), W(45, 90, 'W'), X(45, 135, 'X'), Y(315, 90, 'Y'), Z(135, 90, 'Z');

	private final int leftFlagAngle;
	private final int rightFlagAngle;
	private final char character;
	private final char numberChar;

	SemaphorePosition(int leftFlagAngle, int rightFlagAngle, char character) {
		this.leftFlagAngle = leftFlagAngle;
		this.rightFlagAngle = rightFlagAngle;
		this.character = character;
		this.numberChar = '\0';
	}

	SemaphorePosition(int leftFlagAngle, int rightFlagAngle, char character, char numberChar) {
		this.leftFlagAngle = leftFlagAngle;
		this.rightFlagAngle = rightFlagAngle;
		this.character = character;
		this.numberChar = numberChar;
	}

	public static SemaphorePosition fromAngles(int leftAngle, int rightAngle) {
		for(SemaphorePosition pos: values()) {
			if(pos.leftFlagAngle == leftAngle && pos.rightFlagAngle == rightAngle) {
				return pos;
			}
		}
		return null;
	}

	public boolean isValidCharacter() {
		return (character >= 'A' && character <= 'Z') || (character >= '0' && character <= '9');
	}

	public boolean hasNumber() {
		return numberChar != '\0';
	}

	public char getNumberChar() {
		return numberChar;
	}
}
