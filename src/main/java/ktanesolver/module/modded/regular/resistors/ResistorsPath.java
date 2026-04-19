package ktanesolver.module.modded.regular.resistors;

public enum ResistorsPath {
	DIRECT("No resistors"),
	TOP("Top resistor"),
	BOTTOM("Bottom resistor"),
	SERIES("Both resistors in series"),
	PARALLEL("Both resistors in parallel");

	private final String displayName;

	ResistorsPath(String displayName) {
		this.displayName = displayName;
	}

	public String displayName() {
		return displayName;
	}
}
