
package ktanesolver.enums;

import lombok.Getter;

@Getter
public enum ModuleType {
	WIRES(false), BUTTON(false), KEYPADS(false), MEMORY(false), SIMON_SAYS(false), MORSE_CODE(false), FORGET_ME_NOT(true), SOUVENIR(false), WHOS_ON_FIRST(false), THIRD_BASE(false), VENTING_GAS(true), CAPACITOR_DISCHARGE(
		true), COMPLICATED_WIRES(false), WIRE_SEQUENCES(false), PASSWORDS(false), MAZES(false), KNOBS(true), COLOR_FLASH(false), PIANO_KEYS(false), SEMAPHORE(false), MATH(false), PERSPECTIVE_PEGS(false), EMOJI_MATH(
	false), SWITCHES(false), TWO_BITS(false), WORD_SCRAMBLE(false), WORD_SEARCH(false), BROKEN_BUTTONS(false), ANAGRAMS(false), COMBINATION_LOCK(false), ROUND_KEYPAD(false), NUMBER_PAD(false), LISTENING(false), FOREIGN_EXCHANGE_RATES(false), ORIENTATION_CUBE(false), MORSEMATICS(false), CONNECTION_CHECK(false), LETTER_KEYS(false), LOGIC(false), ASTROLOGY(false), MYSTIC_SQUARE(false), CRAZY_TALK(false), ADVENTURE_GAME(false), PLUMBING(false), CRUEL_PIANO_KEYS(false), SAFETY_SAFE(false), CRYPTOGRAPHY(false), CAESAR_CIPHER(false), TURN_THE_KEY(false), TURN_THE_KEYS(false), CHESS(false), MOUSE_IN_THE_MAZE(false), HEXAMAZE(false), BITMAPS(false), COLORED_SQUARES(false), ADJACENT_LETTERS(false), SILLY_SLOTS(false), SKEWED_SLOTS(false), THREE_D_MAZE(false), SIMON_STATES(false), LAUNDRY(false), PROBING(false), ALPHABET(false), MICROCONTROLLER(false), MURDER(false), RESISTORS(false), GAMEPAD(false), TIC_TAC_TOE(false), MONSPLODE_FIGHT(false), SHAPE_SHIFT(false), FOLLOW_THE_LEADER(false), FRIENDSHIP(false), THE_BULB(false), BLIND_ALLEY(false), SEA_SHELLS(false), ENGLISH_TEST(false), ROCK_PAPER_SCISSORS_LIZARD_SPOCK(false), SQUARE_BUTTON(false);

	private final boolean needy;

	ModuleType(boolean needy) {
		this.needy = needy;
	}

}
