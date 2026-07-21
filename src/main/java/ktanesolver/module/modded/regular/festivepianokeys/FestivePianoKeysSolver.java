package ktanesolver.module.modded.regular.festivepianokeys;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;
import ktanesolver.module.shared.music.PianoKeysNote;

@Service
@ModuleInfo(
	type = ModuleType.FESTIVE_PIANO_KEYS,
	id = "FestivePianoKeys",
	name = "Festive Piano Keys",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Match the three musical symbols and bomb edgework to a festive melody.",
	tags = { "music", "pattern", "modded" }
)
public class FestivePianoKeysSolver extends AbstractModuleSolver<FestivePianoKeysInput, FestivePianoKeysOutput> {

	@Override
	protected SolveResult<FestivePianoKeysOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, FestivePianoKeysInput input
	) {
		List<FestivePianoKeysSymbol> symbols = input.symbols();
		storeState(module, "input", input);
		if (symbols == null || symbols.size() != 3 || symbols.stream().anyMatch(Objects::isNull)
			|| new HashSet<>(symbols).size() != 3) {
			return failure("Festive Piano Keys requires exactly 3 different symbols");
		}

		return success(new FestivePianoKeysOutput(findMelody(symbols, bomb)));
	}

	private List<PianoKeysNote> findMelody(List<FestivePianoKeysSymbol> symbols, BombEntity bomb) {
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber();
		long evenDigits = serial.chars().filter(Character::isDigit).filter(c -> (c - '0') % 2 == 0).count();
		long oddDigits = serial.chars().filter(Character::isDigit).filter(c -> (c - '0') % 2 != 0).count();

		if (symbols.contains(FestivePianoKeysSymbol.CAESURA) && evenDigits > oddDigits) {
			return notes(PianoKeysNote.D_SHARP, PianoKeysNote.F, PianoKeysNote.D_SHARP, PianoKeysNote.C,
				PianoKeysNote.G_SHARP, PianoKeysNote.F, PianoKeysNote.D_SHARP);
		}
		if ((symbols.contains(FestivePianoKeysSymbol.DAL_SEGNO) || symbols.contains(FestivePianoKeysSymbol.SIXTEENTH_NOTE))
			&& BombEdgeworkUtils.hasDuplicateSerialCharacters(bomb)) {
			return notes(PianoKeysNote.C_SHARP, PianoKeysNote.B, PianoKeysNote.A, PianoKeysNote.F_SHARP,
				PianoKeysNote.G_SHARP, PianoKeysNote.A, PianoKeysNote.G_SHARP, PianoKeysNote.F_SHARP);
		}
		if (symbols.contains(FestivePianoKeysSymbol.MORDENT) && symbols.contains(FestivePianoKeysSymbol.PEDAL_UP)) {
			return notes(PianoKeysNote.G, PianoKeysNote.A, PianoKeysNote.G, PianoKeysNote.E,
				PianoKeysNote.G, PianoKeysNote.A, PianoKeysNote.G, PianoKeysNote.E);
		}
		if ((symbols.contains(FestivePianoKeysSymbol.UP_BOW) || symbols.contains(FestivePianoKeysSymbol.DOWN_BOW))
			&& BombEdgeworkUtils.getDistinctPortTypeCount(bomb) <= 2) {
			return notes(PianoKeysNote.D_SHARP, PianoKeysNote.D_SHARP, PianoKeysNote.C_SHARP, PianoKeysNote.G_SHARP,
				PianoKeysNote.D_SHARP, PianoKeysNote.D_SHARP, PianoKeysNote.F, PianoKeysNote.C_SHARP);
		}
		if (symbols.contains(FestivePianoKeysSymbol.MARCATO) && bomb.getIndicators().entrySet().stream()
			.anyMatch(indicator -> Boolean.TRUE.equals(indicator.getValue()) && hasVowel(indicator.getKey()))) {
			return notes(PianoKeysNote.B, PianoKeysNote.A, PianoKeysNote.G, PianoKeysNote.D_SHARP, PianoKeysNote.D,
				PianoKeysNote.A, PianoKeysNote.B, PianoKeysNote.A, PianoKeysNote.G);
		}
		if ((symbols.contains(FestivePianoKeysSymbol.SIXTEENTH_REST) || symbols.contains(FestivePianoKeysSymbol.SIXTEENTH_NOTE))
			&& bomb.getAaBatteryCount() >= 3) {
			return notes(PianoKeysNote.F_SHARP, PianoKeysNote.G, PianoKeysNote.A, PianoKeysNote.A, PianoKeysNote.D,
				PianoKeysNote.B, PianoKeysNote.A, PianoKeysNote.G, PianoKeysNote.E, PianoKeysNote.D);
		}
		if (symbols.contains(FestivePianoKeysSymbol.SEMIBREVE_NOTE) && symbols.contains(FestivePianoKeysSymbol.BREVE)) {
			return notes(PianoKeysNote.G, PianoKeysNote.E, PianoKeysNote.F, PianoKeysNote.G, PianoKeysNote.C,
				PianoKeysNote.B, PianoKeysNote.C, PianoKeysNote.D, PianoKeysNote.C, PianoKeysNote.B, PianoKeysNote.A, PianoKeysNote.G);
		}
		if ((symbols.contains(FestivePianoKeysSymbol.ACCENT) || symbols.contains(FestivePianoKeysSymbol.MARCATO)
			|| symbols.contains(FestivePianoKeysSymbol.UP_BOW)) && serial.matches(".*[19].*")) {
			return notes(PianoKeysNote.G, PianoKeysNote.G, PianoKeysNote.G, PianoKeysNote.G, PianoKeysNote.G,
				PianoKeysNote.G, PianoKeysNote.G, PianoKeysNote.A_SHARP, PianoKeysNote.D_SHARP, PianoKeysNote.F, PianoKeysNote.G);
		}
		if (symbols.contains(FestivePianoKeysSymbol.DAL_SEGNO) || symbols.contains(FestivePianoKeysSymbol.C_CLEF)
			|| symbols.contains(FestivePianoKeysSymbol.CAESURA)) {
			return notes(PianoKeysNote.D, PianoKeysNote.D, PianoKeysNote.D, PianoKeysNote.C_SHARP, PianoKeysNote.C_SHARP,
				PianoKeysNote.C_SHARP, PianoKeysNote.B, PianoKeysNote.C_SHARP, PianoKeysNote.B, PianoKeysNote.F_SHARP);
		}

		int repetitions = serial.chars().filter(Character::isDigit).map(c -> c - '0').max().orElse(0) + 1;
		List<PianoKeysNote> melody = new ArrayList<>(repetitions * 4);
		for (int i = 0; i < repetitions; i++) {
			melody.addAll(notes(PianoKeysNote.A_SHARP, PianoKeysNote.A, PianoKeysNote.A_SHARP, PianoKeysNote.G));
		}
		return melody;
	}

	private static boolean hasVowel(String value) {
		return value != null && value.chars().anyMatch(c -> "AEIOU".indexOf(Character.toUpperCase(c)) >= 0);
	}

	private static List<PianoKeysNote> notes(PianoKeysNote... notes) {
		return List.of(notes);
	}
}
