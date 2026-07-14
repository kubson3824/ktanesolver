package ktanesolver.module.modded.regular.chordqualities;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.CHORD_QUALITIES,
	id = "chord-qualities",
	name = "Chord Qualities",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the displayed four-note chord and find the chord to submit.",
	tags = { "music", "chords", "notes", "modded" }
)
public class ChordQualitiesSolver extends AbstractModuleSolver<ChordQualitiesInput, ChordQualitiesOutput> {
	private static final List<String> NOTES = List.of("A", "A♯", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯");
	private static final List<Quality> QUALITIES = List.of(
		new Quality("7", 10, 4, 7, 10), new Quality("-7", 11, 3, 7, 10),
		new Quality("Δ7", 1, 4, 7, 11), new Quality("-Δ7", 8, 3, 7, 11),
		new Quality("7♯9", 0, 3, 4, 10), new Quality("ø", 4, 3, 6, 10),
		new Quality("add9", 6, 2, 4, 7), new Quality("-add9", 7, 2, 3, 7),
		new Quality("7♯5", 9, 4, 8, 10), new Quality("Δ7♯5", 3, 4, 8, 11),
		new Quality("7sus", 5, 5, 7, 10), new Quality("-Δ7♯5", 2, 3, 8, 11)
	);
	private static final int[] ROOT_TO_QUALITY = { 11, 9, 1, 5, 7, 2, 4, 10, 6, 0, 3, 8 };

	@Override
	protected SolveResult<ChordQualitiesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ChordQualitiesInput input
	) {
		if (input == null || input.notes() == null || input.notes().size() != 4) {
			return failure("Select exactly four notes");
		}
		List<String> givenNotes = input.notes().stream().map(ChordQualitiesSolver::normalize).toList();
		if (givenNotes.stream().anyMatch(note -> !NOTES.contains(note)) || new HashSet<>(givenNotes).size() != 4) {
			return failure("Select four distinct notes from the wheel");
		}

		Chord given = null;
		for (int root = 0; root < NOTES.size(); root++) {
			for (Quality quality : QUALITIES) {
				Chord candidate = new Chord(root, quality);
				if (new HashSet<>(candidate.notes()).equals(new HashSet<>(givenNotes))) {
					if (given != null) return failure("Those notes do not identify a unique chord");
					given = candidate;
				}
			}
		}
		if (given == null) return failure("Those notes are not a chord in the lookup table");

		Chord answer = new Chord(given.quality().targetRoot(), QUALITIES.get(ROOT_TO_QUALITY[given.root()]));
		List<String> canonicalGivenNotes = NOTES.stream().filter(givenNotes::contains).toList();
		storeState(module, "input", new ChordQualitiesInput(canonicalGivenNotes));
		storeState(module, "givenNotes", canonicalGivenNotes);
		return success(new ChordQualitiesOutput(given.name(), answer.name(), answer.notes()));
	}

	private static String normalize(String note) {
		return note == null ? "" : note.trim().toUpperCase(Locale.ROOT).replace("#", "♯");
	}

	private record Quality(String name, int targetRoot, int... offsets) {}

	private record Chord(int root, Quality quality) {
		List<String> notes() {
			return List.of(
				NOTES.get(root),
				NOTES.get((root + quality.offsets()[0]) % 12),
				NOTES.get((root + quality.offsets()[1]) % 12),
				NOTES.get((root + quality.offsets()[2]) % 12)
			);
		}

		String name() {
			return NOTES.get(root) + quality.name();
		}
	}
}
