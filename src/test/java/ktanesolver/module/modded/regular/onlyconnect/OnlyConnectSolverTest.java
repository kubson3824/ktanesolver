package ktanesolver.module.modded.regular.onlyconnect;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class OnlyConnectSolverTest {
	private final OnlyConnectSolver solver = new OnlyConnectSolver();

	@Test
	void solvesBothRoundsAndRecordsTheInitialGlyphPositions() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(new LinkedHashSet<>(List.of(PortType.PS2, PortType.DVI)));
		bomb.setPortPlates(List.of(plate));
		ModuleEntity module = module();

		OnlyConnectOutput roundOne = success(solver.solve(new RoundEntity(), bomb, module, new OnlyConnectInput(
			1, "A", List.of("Two Reeds", "Lion", "Twisted Flax", "Horned Viper", "Water", "Eye of Horus"), null
		)));
		assertThat(roundOne.hieroglyph()).isEqualTo("Two Reeds");
		assertThat(roundOne.position()).isEqualTo(1);
		assertThat(module.isSolved()).isFalse();
		assertThat(module.getState().get("hieroglyphs")).isEqualTo(List.of(
			"Two Reeds", "Lion", "Twisted Flax", "Horned Viper", "Water", "Eye of Horus"
		));

		OnlyConnectOutput roundTwo = success(solver.solve(new RoundEntity(), bomb, module, new OnlyConnectInput(
			2, null, null, List.of("å", "ĉ", "ą", "æ", "ĝ", "ł", "ø", "ĥ", "ż")
		)));
		assertThat(roundTwo.groups()).extracting(group -> String.join("", group.letters()))
			.containsExactlyInAnyOrder("åæø", "ĉĝĥ", "ąłż");
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void rejectsAWallWithRepeatedLetters() {
		ModuleEntity module = module();
		module.getState().put("hieroglyphs", List.of("Two Reeds"));

		SolveResult<OnlyConnectOutput> result = solver.solve(new RoundEntity(), new BombEntity(), module,
			new OnlyConnectInput(2, null, null, List.of("å", "å", "ą", "æ", "ĝ", "ł", "ø", "ĥ", "ż")));

		assertThat(result).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private static OnlyConnectOutput success(SolveResult<OnlyConnectOutput> result) {
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return ((SolveSuccess<OnlyConnectOutput>) result).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.ONLY_CONNECT);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
