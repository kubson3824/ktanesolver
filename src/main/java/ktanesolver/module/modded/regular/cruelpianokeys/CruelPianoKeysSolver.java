package ktanesolver.module.modded.regular.cruelpianokeys;

import java.util.ArrayList;
import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.pianokeys.PianoKeysNote;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.CRUEL_PIANO_KEYS,
	id = "cruel_piano_keys",
	name = "Cruel Piano Keys",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Match symbols to a rule, look up a 12-tone row, apply transformation and transposition, then play the sequence.",
	tags = { "music", "pattern", "modded" }
)
public class CruelPianoKeysSolver extends AbstractModuleSolver<CruelPianoKeysInput, CruelPianoKeysOutput> {

	private static final PianoKeysNote[] SEMITONE_ORDER = {
		PianoKeysNote.C, PianoKeysNote.C_SHARP, PianoKeysNote.D, PianoKeysNote.D_SHARP,
		PianoKeysNote.E, PianoKeysNote.F, PianoKeysNote.F_SHARP, PianoKeysNote.G,
		PianoKeysNote.G_SHARP, PianoKeysNote.A, PianoKeysNote.A_SHARP, PianoKeysNote.B
	};

	@SuppressWarnings("unchecked")
	private static final List<PianoKeysNote>[] TABLE_1 = new List[] {
		// 0: F D F# G# C B A# C# G E D# A
		List.of(PianoKeysNote.F, PianoKeysNote.D, PianoKeysNote.F_SHARP, PianoKeysNote.G_SHARP,
			PianoKeysNote.C, PianoKeysNote.B, PianoKeysNote.A_SHARP, PianoKeysNote.C_SHARP,
			PianoKeysNote.G, PianoKeysNote.E, PianoKeysNote.D_SHARP, PianoKeysNote.A),
		// 1: A# A C E C# D D# G B F# G# F
		List.of(PianoKeysNote.A_SHARP, PianoKeysNote.A, PianoKeysNote.C, PianoKeysNote.E,
			PianoKeysNote.C_SHARP, PianoKeysNote.D, PianoKeysNote.D_SHARP, PianoKeysNote.G,
			PianoKeysNote.B, PianoKeysNote.F_SHARP, PianoKeysNote.G_SHARP, PianoKeysNote.F),
		// 2: F# B A G# D C G C# F D# E A#
		List.of(PianoKeysNote.F_SHARP, PianoKeysNote.B, PianoKeysNote.A, PianoKeysNote.G_SHARP,
			PianoKeysNote.D, PianoKeysNote.C, PianoKeysNote.G, PianoKeysNote.C_SHARP,
			PianoKeysNote.F, PianoKeysNote.D_SHARP, PianoKeysNote.E, PianoKeysNote.A_SHARP),
		// 3: E D# D F# F A# G# C# C B G A
		List.of(PianoKeysNote.E, PianoKeysNote.D_SHARP, PianoKeysNote.D, PianoKeysNote.F_SHARP,
			PianoKeysNote.F, PianoKeysNote.A_SHARP, PianoKeysNote.G_SHARP, PianoKeysNote.C_SHARP,
			PianoKeysNote.C, PianoKeysNote.B, PianoKeysNote.G, PianoKeysNote.A),
		// 4: D E A A# C B C# G# F F# D# G
		List.of(PianoKeysNote.D, PianoKeysNote.E, PianoKeysNote.A, PianoKeysNote.A_SHARP,
			PianoKeysNote.C, PianoKeysNote.B, PianoKeysNote.C_SHARP, PianoKeysNote.G_SHARP,
			PianoKeysNote.F, PianoKeysNote.F_SHARP, PianoKeysNote.D_SHARP, PianoKeysNote.G),
		// 5: C D# F# D F C# B A G A# E G#
		List.of(PianoKeysNote.C, PianoKeysNote.D_SHARP, PianoKeysNote.F_SHARP, PianoKeysNote.D,
			PianoKeysNote.F, PianoKeysNote.C_SHARP, PianoKeysNote.B, PianoKeysNote.A,
			PianoKeysNote.G, PianoKeysNote.A_SHARP, PianoKeysNote.E, PianoKeysNote.G_SHARP),
		// 6: G# C A# C# E G B D# A D F F#
		List.of(PianoKeysNote.G_SHARP, PianoKeysNote.C, PianoKeysNote.A_SHARP, PianoKeysNote.C_SHARP,
			PianoKeysNote.E, PianoKeysNote.G, PianoKeysNote.B, PianoKeysNote.D_SHARP,
			PianoKeysNote.A, PianoKeysNote.D, PianoKeysNote.F, PianoKeysNote.F_SHARP),
		// 7: E A C# B G G# A# D# F# F C D
		List.of(PianoKeysNote.E, PianoKeysNote.A, PianoKeysNote.C_SHARP, PianoKeysNote.B,
			PianoKeysNote.G, PianoKeysNote.G_SHARP, PianoKeysNote.A_SHARP, PianoKeysNote.D_SHARP,
			PianoKeysNote.F_SHARP, PianoKeysNote.F, PianoKeysNote.C, PianoKeysNote.D),
		// 8: G# D# D E A# C# F# G F A C B
		List.of(PianoKeysNote.G_SHARP, PianoKeysNote.D_SHARP, PianoKeysNote.D, PianoKeysNote.E,
			PianoKeysNote.A_SHARP, PianoKeysNote.C_SHARP, PianoKeysNote.F_SHARP, PianoKeysNote.G,
			PianoKeysNote.F, PianoKeysNote.A, PianoKeysNote.C, PianoKeysNote.B),
		// 9: D# G# C B D C# F# A# F G A E
		List.of(PianoKeysNote.D_SHARP, PianoKeysNote.G_SHARP, PianoKeysNote.C, PianoKeysNote.B,
			PianoKeysNote.D, PianoKeysNote.C_SHARP, PianoKeysNote.F_SHARP, PianoKeysNote.A_SHARP,
			PianoKeysNote.F, PianoKeysNote.G, PianoKeysNote.A, PianoKeysNote.E)
	};

	@Override
	protected SolveResult<CruelPianoKeysOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, CruelPianoKeysInput input) {
		List<CruelPianoKeysSymbol> symbols = input.symbols();
		storeState(module, "input", input);
		if (symbols == null || symbols.size() != 4) {
			return failure("Cruel Piano Keys requires exactly 4 symbols");
		}

		RuleMatch match = evaluateTable2(symbols, bomb, input.minutesRemaining() != null ? input.minutesRemaining() : 0);
		if (match == null) {
			return failure("No rule matched. Use the Piano Keys manual for the displayed sequence.");
		}

		List<PianoKeysNote> row = new ArrayList<>(TABLE_1[match.lookupIndex]);
		row = applyTransformation(row, match.transformation);
		if (match.transposeSemitones != 0) {
			row = transpose(row, match.transposeSemitones);
		}
		return success(new CruelPianoKeysOutput(row));
	}

	private static final class RuleMatch {
		final int lookupIndex;
		final Transformation transformation;
		final int transposeSemitones;

		RuleMatch(int lookupIndex, Transformation transformation, int transposeSemitones) {
			this.lookupIndex = lookupIndex;
			this.transformation = transformation;
			this.transposeSemitones = transposeSemitones;
		}
	}

	private enum Transformation { P, R, I, RI }

	private RuleMatch evaluateTable2(List<CruelPianoKeysSymbol> symbols, BombEntity bomb, int minutesRemaining) {
		// 1. Breve AND T; 2+ indicators → left-most digit of serial → RI
		if (symbols.contains(CruelPianoKeysSymbol.BREVE) && symbols.contains(CruelPianoKeysSymbol.T)
			&& bomb.getIndicators().size() >= 2) {
			return new RuleMatch(getLeftmostDigit(bomb), Transformation.RI, 0);
		}
		// 2. # or double sharp; empty port plate → battery holders (mod 10) → P, transpose down by minutes remaining
		if ((symbols.contains(CruelPianoKeysSymbol.SHARP) || symbols.contains(CruelPianoKeysSymbol.DOUBLE_SHARP))
			&& hasEmptyPortPlate(bomb)) {
			int idx = normalize0to9(bomb.getBatteryHolders());
			return new RuleMatch(idx, Transformation.P, -minutesRemaining);
		}
		// 3. U or down bow; 2+ of a certain type of port → LSD of completed modules → I
		if ((symbols.contains(CruelPianoKeysSymbol.U) || symbols.contains(CruelPianoKeysSymbol.DOWN_BOW))
			&& hasTwoOrMoreOfSamePortType(bomb)) {
			long completed = bomb.getModules().stream().filter(ModuleEntity::isSolved).count();
			return new RuleMatch((int)(completed % 10), Transformation.I, 0);
		}
		// 4. B AND 16th rest; 2+ port plates → 9 minus unlit indicators (normalize 0-9) → R
		if (symbols.contains(CruelPianoKeysSymbol.B) && symbols.contains(CruelPianoKeysSymbol.SIXTEENTH_REST)
			&& bomb.getPortPlates().size() >= 2) {
			long unlit = bomb.getIndicators().values().stream().filter(b -> !Boolean.TRUE.equals(b)).count();
			int idx = normalize0to9(9 - (int)unlit);
			return new RuleMatch(idx, Transformation.R, 0);
		}
		// 5. C or c; serial contains 1+ vowels → LSD of strikes → R, transpose down 3
		if ((symbols.contains(CruelPianoKeysSymbol.C) || symbols.contains(CruelPianoKeysSymbol.C_LOWER))
			&& bomb.serialHasVowel()) {
			int idx = bomb.getStrikes() % 10;
			return new RuleMatch(idx, Transformation.R, -3);
		}
		// 6. n or m; even batteries → DVI present: 7 else 3 → P, transpose up by number of ports
		if ((symbols.contains(CruelPianoKeysSymbol.N) || symbols.contains(CruelPianoKeysSymbol.M))
			&& (bomb.getBatteryCount() % 2 == 0)) {
			int idx = bomb.hasPort(PortType.DVI) ? 7 : 3;
			int ports = getTotalPortCount(bomb);
			return new RuleMatch(idx, Transformation.P, ports);
		}
		// 7. b or quarter rest; indicator with no vowels in label → 8 → I
		if ((symbols.contains(CruelPianoKeysSymbol.B_LOWER) || symbols.contains(CruelPianoKeysSymbol.QUARTER_REST))
			&& hasIndicatorWithNoVowels(bomb)) {
			return new RuleMatch(8, Transformation.I, 0);
		}
		// 8. down bow or 16th rest; less than 2 ports → 4 → R
		if ((symbols.contains(CruelPianoKeysSymbol.DOWN_BOW) || symbols.contains(CruelPianoKeysSymbol.SIXTEENTH_REST))
			&& getTotalPortCount(bomb) < 2) {
			return new RuleMatch(4, Transformation.R, 0);
		}
		// 9. breve or double sharp; (no other requirements) → 5 → P
		if (symbols.contains(CruelPianoKeysSymbol.BREVE) || symbols.contains(CruelPianoKeysSymbol.DOUBLE_SHARP)) {
			return new RuleMatch(5, Transformation.P, 0);
		}
		return null;
	}

	private static int getLeftmostDigit(BombEntity bomb) {
		String s = bomb.getSerialNumber();
		if (s == null) return 0;
		return s.chars()
			.filter(Character::isDigit)
			.map(c -> c - '0')
			.findFirst()
			.orElse(0);
	}

	private static int normalize0to9(int value) {
		int v = value;
		while (v > 9) v -= 10;
		while (v < 0) v += 10;
		return v;
	}

	private static boolean hasEmptyPortPlate(BombEntity bomb) {
		return bomb.getPortPlates().stream().anyMatch(p -> p.getPorts().isEmpty());
	}

	private static boolean hasTwoOrMoreOfSamePortType(BombEntity bomb) {
		for (PortType type : PortType.values()) {
			long count = bomb.getPortPlates().stream().filter(p -> p.getPorts().contains(type)).count();
			if (count >= 2) return true;
		}
		return false;
	}

	private static int getTotalPortCount(BombEntity bomb) {
		return bomb.getPortPlates().stream()
			.mapToInt(p -> p.getPorts().size())
			.sum();
	}

	private static boolean hasIndicatorWithNoVowels(BombEntity bomb) {
		return bomb.getIndicators().keySet().stream()
			.anyMatch(label -> label.chars().noneMatch(c -> "AEIOU".indexOf(Character.toUpperCase(c)) >= 0));
	}

	private List<PianoKeysNote> applyTransformation(List<PianoKeysNote> row, Transformation t) {
		return switch (t) {
			case P -> new ArrayList<>(row);
			case R -> {
				List<PianoKeysNote> rev = new ArrayList<>(row);
				java.util.Collections.reverse(rev);
				yield rev;
			}
			case I -> inverse(row);
			case RI -> {
				List<PianoKeysNote> inv = inverse(row);
				java.util.Collections.reverse(inv);
				yield inv;
			}
		};
	}

	private List<PianoKeysNote> inverse(List<PianoKeysNote> row) {
		if (row.isEmpty()) return row;
		List<PianoKeysNote> result = new ArrayList<>();
		result.add(row.get(0));
		int firstSemitone = noteToSemitone(row.get(0));
		for (int i = 1; i < row.size(); i++) {
			int interval = noteToSemitone(row.get(i)) - firstSemitone;
			int inverted = (firstSemitone - interval + 12) % 12;
			if (inverted < 0) inverted += 12;
			result.add(semitoneToNote(inverted));
		}
		return result;
	}

	private List<PianoKeysNote> transpose(List<PianoKeysNote> row, int semitones) {
		int delta = ((semitones % 12) + 12) % 12;
		if (delta == 0) return new ArrayList<>(row);
		List<PianoKeysNote> result = new ArrayList<>();
		for (PianoKeysNote n : row) {
			int s = (noteToSemitone(n) + semitones % 12 + 12) % 12;
			result.add(semitoneToNote(s));
		}
		return result;
	}

	private static int noteToSemitone(PianoKeysNote n) {
		for (int i = 0; i < SEMITONE_ORDER.length; i++) {
			if (SEMITONE_ORDER[i] == n) return i;
		}
		return 0;
	}

	private static PianoKeysNote semitoneToNote(int semitone) {
		return SEMITONE_ORDER[((semitone % 12) + 12) % 12];
	}
}
