package ktanesolver.module.modded.regular.guitarchords;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.GUITAR_CHORDS,
	id = "guitarChords",
	name = "Guitar Chords",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Play the displayed chord at the correct capo position across three stages.",
	tags = {"music", "chords", "edgework", "multi-stage"}
)
public class GuitarChordsSolver extends AbstractModuleSolver<GuitarChordsInput, GuitarChordsOutput> {
	private static final Map<String, String> CHORDS = Map.ofEntries(
		Map.entry("Ab", "022100"), Map.entry("C", "221-0-"), Map.entry("Em", "-11---"),
		Map.entry("Ab7", "--0001"), Map.entry("C7", "-2120-"), Map.entry("E7", "-1102-"),
		Map.entry("Abm7", "--00-1"), Map.entry("Cm7", "--0202"), Map.entry("Em7", "-1----"),
		Map.entry("A", "--111-"), Map.entry("C#", "--2010"), Map.entry("F7", "020100"),
		Map.entry("Am", "--110-"), Map.entry("C#m", "--101-"), Map.entry("Fm7", "020000"),
		Map.entry("A7", "--1112"), Map.entry("C#7", "--2313"), Map.entry("F#", "133211"),
		Map.entry("Am7", "--1102"), Map.entry("C#m7", "--1313"), Map.entry("F#m", "133111"),
		Map.entry("Bb", "-02220"), Map.entry("D", "---121"), Map.entry("F#7", "--321-"),
		Map.entry("Bbm", "-02210"), Map.entry("Dm", "---120"), Map.entry("F#m7", "--1111"),
		Map.entry("Bbm7", "--2213"), Map.entry("D7", "---101"), Map.entry("G", "21---2"),
		Map.entry("B", "-13331"), Map.entry("Dm7", "---100"), Map.entry("Gm", "022000"),
		Map.entry("Bm", "-13321"), Map.entry("Ebm", "--3231"), Map.entry("G7", "21---0"),
		Map.entry("B7", "-101-1"), Map.entry("Eb7", "--0212")
	);

	@Override
	protected SolveResult<GuitarChordsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, GuitarChordsInput input
	) {
		if (input == null || input.chord() == null) return failure("Select the displayed chord");
		String chord = CHORDS.keySet().stream()
			.filter(candidate -> candidate.equalsIgnoreCase(input.chord().trim()))
			.findFirst().orElse(null);
		if (chord == null) return failure("Select a chord from the manual's chord chart");

		int stage = ((Number) module.getState().getOrDefault("stage", 0)).intValue() + 1;
		if (stage > 3) return failure("All Guitar Chords stages are already complete");
		int capo = capoPosition(stage, bomb);
		List<String> frets = frets(CHORDS.get(chord), capo);

		storeState(module, Map.of("stage", stage, "input", new GuitarChordsInput(chord)));
		return success(new GuitarChordsOutput(stage, chord, capo, frets), stage == 3);
	}

	private static int capoPosition(int stage, BombEntity bomb) {
		return switch (stage) {
			case 1 -> bomb.isIndicatorLit("BOB") ? 9
				: bomb.hasPort(PortType.PARALLEL) && bomb.hasPort(PortType.RJ45) ? 7
				: bomb.getBatteryCount() < 3 ? 5
				: bomb.isLastDigitOdd() ? 3 : 0;
			case 2 -> bomb.hasPort(PortType.PS2) || bomb.hasPort(PortType.SERIAL) ? 5
				: bomb.serialHasVowel() ? 0
				: bomb.getBatteryCount() > 5 ? 9
				: bomb.isIndicatorUnlit("SIG") ? 7 : 3;
			default -> bomb.getBatteryCount() == 0 ? 3
				: BombEdgeworkUtils.getSerialDigitSum(bomb) < 10 ? 5
				: bomb.hasIndicator("FRQ") ? 7
				: bomb.hasPort(PortType.STEREO_RCA) || bomb.hasPort(PortType.DVI) ? 0 : 9;
		};
	}

	private static List<String> frets(String topToBottom, int capo) {
		List<String> frets = new ArrayList<>(6);
		for (int index = topToBottom.length() - 1; index >= 0; index--) {
			char fret = topToBottom.charAt(index);
			frets.add(fret == '-' ? "-" : Integer.toString(fret - '0' + capo));
		}
		return frets;
	}
}
