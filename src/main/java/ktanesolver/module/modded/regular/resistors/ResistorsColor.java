package ktanesolver.module.modded.regular.resistors;

public enum ResistorsColor {
	BLACK(0, 1.0),
	BROWN(1, 10.0),
	RED(2, 100.0),
	ORANGE(3, 1_000.0),
	YELLOW(4, 10_000.0),
	GREEN(5, 100_000.0),
	BLUE(6, 1_000_000.0),
	VIOLET(7, 10_000_000.0),
	GRAY(8, null),
	WHITE(9, null),
	GOLD(null, 0.1),
	SILVER(null, 0.01);

	private final Integer digit;
	private final Double multiplier;

	ResistorsColor(Integer digit, Double multiplier) {
		this.digit = digit;
		this.multiplier = multiplier;
	}

	public int digitOrThrow(String positionLabel) {
		if(digit == null) {
			throw new IllegalArgumentException(name() + " cannot be used as the " + positionLabel);
		}
		return digit;
	}

	public double multiplierOrThrow() {
		if(multiplier == null) {
			throw new IllegalArgumentException(name() + " cannot be used as the multiplier band");
		}
		return multiplier;
	}
}
