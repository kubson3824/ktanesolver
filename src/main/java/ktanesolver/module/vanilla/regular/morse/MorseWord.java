
package ktanesolver.module.vanilla.regular.morse;

public enum MorseWord {
	SHELL("SHELL", 3.505), HALLS("HALLS", 3.515), SLICK("SLICK", 3.522), TRICK("TRICK", 3.532), BOXES("BOXES", 3.535), LEAKS("LEAKS", 3.542), STROBE("STROBE", 3.545), BISTRO("BISTRO", 3.552), FLICK(
		"FLICK", 3.555), BOMBS("BOMBS", 3.565), BREAK("BREAK", 3.572), BRICK("BRICK", 3.575), STEAK("STEAK", 3.582), STING("STING", 3.592), VECTOR("VECTOR", 3.595), BEATS("BEATS", 3.600);

	public final String word;
	public final double frequency;

	MorseWord(String word, double frequency) {
		this.word = word;
		this.frequency = frequency;

	}
}
