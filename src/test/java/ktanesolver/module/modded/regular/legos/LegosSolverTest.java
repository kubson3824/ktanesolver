package ktanesolver.module.modded.regular.legos;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.legos.LegosInput.Color;
import ktanesolver.module.modded.regular.legos.LegosInput.Connection;
import ktanesolver.module.modded.regular.legos.LegosInput.Piece;
import ktanesolver.module.modded.regular.souvenir.SouvenirInput;
import ktanesolver.module.modded.regular.souvenir.SouvenirOutput;
import ktanesolver.module.modded.regular.souvenir.SouvenirSolver;

class LegosSolverTest {
	private final LegosSolver solver = new LegosSolver();

	@Test
	void reconstructsTheStackAppliesSubmissionRulesAndRecordsSouvenirDimensions() {
		ModuleEntity module = module(ModuleType.LEGOS, false);
		LegosOutput output = solve(module, input());

		assertThat(output.face()).isEqualTo("TOP");
		assertThat(output.orientation()).isEqualTo("NORTH");
		assertThat(output.cells()).hasSize(64)
			.contains("GREEN", "BLUE", "CYAN", "MAGENTA", "YELLOW")
			.doesNotContain("RED");
		assertThat(module.getState().get("pieceDimensions")).isEqualTo(Map.of(
			"red", "3×2", "green", "3×2", "blue", "3×2",
			"cyan", "2×2", "magenta", "3×1", "yellow", "4×1"
		));
	}

	@Test
	void rejectsDisconnectedInstructionsAndAnswersTheSouvenirPieceFamily() {
		LegosInput valid = input();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new LegosInput(valid.pieces(), valid.connections().subList(0, 4)))).isInstanceOf(SolveFailure.class);

		ModuleEntity legos = module(ModuleType.LEGOS, true);
		solve(legos, valid);
		legos.setSolved(true);
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false);
		BombEntity bomb = new BombEntity();
		bomb.setModules(List.of(legos, souvenir));

		@SuppressWarnings("unchecked")
		SouvenirOutput answer = ((SolveSuccess<SouvenirOutput>) new SouvenirSolver().solve(
			new RoundEntity(), bomb, souvenir, new SouvenirInput(legos.getId(), "magenta", List.of(), false)
		)).output();
		assertThat(answer).isEqualTo(new SouvenirOutput("3×1", null));
	}

	private static LegosInput input() {
		List<Piece> pieces = List.of(
			new Piece(Color.RED, 3, 2, false),
			new Piece(Color.GREEN, 3, 2, false),
			new Piece(Color.BLUE, 3, 2, false),
			new Piece(Color.CYAN, 2, 2, false),
			new Piece(Color.MAGENTA, 3, 1, false),
			new Piece(Color.YELLOW, 4, 1, false)
		);
		List<Connection> connections = List.of(
			new Connection(Color.RED, Color.GREEN, 1, 0),
			new Connection(Color.GREEN, Color.BLUE, -1, 0),
			new Connection(Color.BLUE, Color.CYAN, 1, 0),
			new Connection(Color.CYAN, Color.MAGENTA, 0, 1),
			new Connection(Color.MAGENTA, Color.YELLOW, 2, 0)
		);
		return new LegosInput(pieces, connections);
	}

	@SuppressWarnings("unchecked")
	private LegosOutput solve(ModuleEntity module, LegosInput input) {
		return ((SolveSuccess<LegosOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, input
		)).output();
	}

	private static ModuleEntity module(ModuleType type, boolean solved) {
		ModuleEntity module = new ModuleEntity();
		module.setId(UUID.randomUUID());
		module.setType(type);
		module.setSolved(solved);
		module.setState(new HashMap<>());
		return module;
	}
}
