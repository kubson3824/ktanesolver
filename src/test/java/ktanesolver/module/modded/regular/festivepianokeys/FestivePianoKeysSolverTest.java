package ktanesolver.module.modded.regular.festivepianokeys;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.shared.music.PianoKeysNote;

class FestivePianoKeysSolverTest {
	private final FestivePianoKeysSolver solver = new FestivePianoKeysSolver();

	@Test
	void followsRulePriorityAndEdgeworkRules() {
		assertThat(solve(bomb("A2B468"), FestivePianoKeysSymbol.CAESURA, FestivePianoKeysSymbol.C_CLEF,
			FestivePianoKeysSymbol.ACCENT)).startsWith(PianoKeysNote.D_SHARP, PianoKeysNote.F);

		assertThat(solve(bomb("A1A234"), FestivePianoKeysSymbol.DAL_SEGNO, FestivePianoKeysSymbol.MORDENT,
			FestivePianoKeysSymbol.ACCENT)).containsExactly(PianoKeysNote.C_SHARP, PianoKeysNote.B, PianoKeysNote.A,
			PianoKeysNote.F_SHARP, PianoKeysNote.G_SHARP, PianoKeysNote.A, PianoKeysNote.G_SHARP, PianoKeysNote.F_SHARP);

		BombEntity ports = bomb("ABC234");
		ports.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.RJ45), Set.of(PortType.DVI)));
		assertThat(solve(ports, FestivePianoKeysSymbol.UP_BOW, FestivePianoKeysSymbol.MORDENT,
			FestivePianoKeysSymbol.ACCENT)).containsExactly(PianoKeysNote.D_SHARP, PianoKeysNote.D_SHARP,
			PianoKeysNote.C_SHARP, PianoKeysNote.G_SHARP, PianoKeysNote.D_SHARP, PianoKeysNote.D_SHARP,
			PianoKeysNote.F, PianoKeysNote.C_SHARP);

		BombEntity indicator = bomb("ABC234");
		indicator.setIndicators(Map.of("CAR", true));
		assertThat(solve(indicator, FestivePianoKeysSymbol.MARCATO, FestivePianoKeysSymbol.MORDENT,
			FestivePianoKeysSymbol.ACCENT)).startsWith(PianoKeysNote.B, PianoKeysNote.A, PianoKeysNote.G);

		BombEntity batteries = bomb("ABC234");
		batteries.setAaBatteryCount(3);
		assertThat(solve(batteries, FestivePianoKeysSymbol.SIXTEENTH_REST, FestivePianoKeysSymbol.MORDENT,
			FestivePianoKeysSymbol.ACCENT)).startsWith(PianoKeysNote.F_SHARP, PianoKeysNote.G, PianoKeysNote.A);

		assertThat(solve(bomb("ABC203"), FestivePianoKeysSymbol.MORDENT, FestivePianoKeysSymbol.BREVE,
			FestivePianoKeysSymbol.ACCENT)).hasSize(16)
			.containsExactly(PianoKeysNote.A_SHARP, PianoKeysNote.A, PianoKeysNote.A_SHARP, PianoKeysNote.G,
				PianoKeysNote.A_SHARP, PianoKeysNote.A, PianoKeysNote.A_SHARP, PianoKeysNote.G,
				PianoKeysNote.A_SHARP, PianoKeysNote.A, PianoKeysNote.A_SHARP, PianoKeysNote.G,
				PianoKeysNote.A_SHARP, PianoKeysNote.A, PianoKeysNote.A_SHARP, PianoKeysNote.G);
	}

	@Test
	void rejectsRepeatedSymbols() {
		var symbol = FestivePianoKeysSymbol.MORDENT;
		assertThat(solver.solve(new RoundEntity(), bomb("ABC123"), new ModuleEntity(),
			new FestivePianoKeysInput(List.of(symbol, symbol, FestivePianoKeysSymbol.ACCENT))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private List<PianoKeysNote> solve(BombEntity bomb, FestivePianoKeysSymbol... symbols) {
		return ((SolveSuccess<FestivePianoKeysOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(),
			new FestivePianoKeysInput(List.of(symbols)))).output().notes();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setIndicators(new HashMap<>());
		return bomb;
	}
}
