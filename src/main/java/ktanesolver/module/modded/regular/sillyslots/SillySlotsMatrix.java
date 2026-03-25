package ktanesolver.module.modded.regular.sillyslots;

/**
 * Substitution matrix from the manual. For a given keyword (column), each placeholder (row) maps to a value.
 * "Sassy" as placeholder is the keyword itself. Rows: Silly, Soggy, Sally, Simon, Sausage, Steven.
 */
public final class SillySlotsMatrix {

	// Columns: Sassy, Blue, Red, Green, Cherry, Grape, Bomb, Coin (Keyword.ordinal())
	// Rows: Silly, Soggy, Sally, Simon, Sausage, Steven
	private static final Keyword[][] MATRIX = {
		// Silly row: Sassy, Blue, Red, Green, Cherry, Grape, Bomb, Coin
		{ Keyword.BLUE, Keyword.GREEN, Keyword.RED, Keyword.COIN, Keyword.BOMB, Keyword.GRAPE, Keyword.CHERRY, Keyword.CHERRY },
		// Soggy
		{ Keyword.GREEN, Keyword.BLUE, Keyword.RED, Keyword.COIN, Keyword.CHERRY, Keyword.BOMB, Keyword.GRAPE, Keyword.GRAPE },
		// Sally
		{ Keyword.RED, Keyword.BLUE, Keyword.GREEN, Keyword.GRAPE, Keyword.CHERRY, Keyword.BOMB, Keyword.COIN, Keyword.COIN },
		// Simon
		{ Keyword.RED, Keyword.GREEN, Keyword.BLUE, Keyword.BOMB, Keyword.GRAPE, Keyword.CHERRY, Keyword.COIN, Keyword.COIN },
		// Sausage
		{ Keyword.RED, Keyword.BLUE, Keyword.GREEN, Keyword.GRAPE, Keyword.BOMB, Keyword.COIN, Keyword.CHERRY, Keyword.CHERRY },
		// Steven
		{ Keyword.GREEN, Keyword.RED, Keyword.BLUE, Keyword.CHERRY, Keyword.BOMB, Keyword.COIN, Keyword.GRAPE, Keyword.GRAPE }
	};

	private static final int SILLY = 0, SOGGY = 1, SALLY = 2, SIMON = 3, SAUSAGE = 4, STEVEN = 5;

	/** Returns the substituted value for placeholder (e.g. "Silly", "Soggy") when the display keyword is given. */
	public static Keyword substitute(String placeholder, Keyword keyword) {
		if ("SASSY".equals(placeholder)) {
			return keyword;
		}
		int row = switch (placeholder) {
			case "SILLY" -> SILLY;
			case "SOGGY" -> SOGGY;
			case "SALLY" -> SALLY;
			case "SIMON" -> SIMON;
			case "SAUSAGE" -> SAUSAGE;
			case "STEVEN" -> STEVEN;
			default -> throw new IllegalArgumentException("Unknown placeholder: " + placeholder);
		};
		int col = keyword.ordinal();
		return MATRIX[row][col];
	}

	/** Resolve adjective to its substituted colour meaning for the given keyword. */
	public static Keyword substituteAdjective(Adjective adj, Keyword keyword) {
		return substitute(adj.name(), keyword);
	}

	/** Resolve noun to its substituted colour/symbol meaning for the given keyword. */
	public static Keyword substituteNoun(Noun noun, Keyword keyword) {
		return substitute(noun.name(), keyword);
	}

	private SillySlotsMatrix() {
	}
}
