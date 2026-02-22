
package ktanesolver.enums;

import lombok.Getter;

@Getter
public enum ModuleType {
	WIRES(false), BUTTON(false), KEYPADS(false), MEMORY(false), SIMON_SAYS(false), MORSE_CODE(false), FORGET_ME_NOT(true), WHOS_ON_FIRST(false), VENTING_GAS(true), CAPACITOR_DISCHARGE(
		true), COMPLICATED_WIRES(false), WIRE_SEQUENCES(false), PASSWORDS(false), MAZES(false), KNOBS(true), COLOR_FLASH(false), PIANO_KEYS(false), SEMAPHORE(false), MATH(false), EMOJI_MATH(
			false), SWITCHES(false), TWO_BITS(false), WORD_SCRAMBLE(false), ANAGRAMS(false), COMBINATION_LOCK(false), ROUND_KEYPAD(false), LISTENING(false), FOREIGN_EXCHANGE_RATES(false), ORIENTATION_CUBE(false), MORSEMATICS(false), CONNECTION_CHECK(false), LETTER_KEYS(false), LOGIC(false), ASTROLOGY(false), MYSTIC_SQUARE(false), CRAZY_TALK(false), ADVENTURE_GAME(false), PLUMBING(false), CRUEL_PIANO_KEYS(false), SAFETY_SAFE(false), CRYPTOGRAPHY(false), TURN_THE_KEY(false), TURN_THE_KEYS(false), CHESS(false), MOUSE_IN_THE_MAZE(false), THREE_D_MAZE(false);

	private final boolean needy;

	ModuleType(boolean needy) {
		this.needy = needy;
	}

}
