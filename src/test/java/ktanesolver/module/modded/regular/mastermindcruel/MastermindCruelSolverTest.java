package ktanesolver.module.modded.regular.mastermindcruel;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.mastermindcruel.MastermindCruelInput.Attempt;

class MastermindCruelSolverTest {
	private static final List<String> COLORS = List.of("WHITE", "MAGENTA", "YELLOW", "GREEN", "RED", "BLUE");
	private final MastermindCruelSolver solver = new MastermindCruelSolver();

	@Test
	void decodesEveryDisplayColorAndSolvesARepeatedColorCode() {
		BombEntity bomb = bomb();
		List<String> secret = List.of("RED", "BLUE", "RED", "GREEN", "WHITE");
		List<String> firstGuess = List.of("WHITE", "WHITE", "MAGENTA", "MAGENTA", "YELLOW");
		int[] firstFeedback = score(secret, firstGuess);
		Integer equivalentCandidateCount = null;

		for (int color = 0; color < COLORS.size(); color++) {
			Attempt attempt = encoded(firstGuess, firstFeedback, color, color, bomb);
			SolveSuccess<MastermindCruelOutput> result = success(solver.solve(
				new RoundEntity(), bomb, new ModuleEntity(), new MastermindCruelInput(List.of(attempt))));
			if (equivalentCandidateCount == null) equivalentCandidateCount = result.output().remainingCandidates();
			assertThat(result.output().remainingCandidates()).isEqualTo(equivalentCandidateCount);
		}

		List<Attempt> attempts = new ArrayList<>();
		ModuleEntity module = new ModuleEntity();
		SolveSuccess<MastermindCruelOutput> result = success(solver.solve(
			new RoundEntity(), bomb, module, new MastermindCruelInput(attempts)));
		for (int query = 0; query < 25 && !result.solved(); query++) {
			attempts.add(encoded(result.output().nextGuess(), score(secret, result.output().nextGuess()),
				query % COLORS.size(), (query + 2) % COLORS.size(), bomb));
			result = success(solver.solve(new RoundEntity(), bomb, module, new MastermindCruelInput(attempts)));
		}

		assertThat(result.solved()).isTrue();
		assertThat(result.output().nextGuess()).isEqualTo(secret);
		assertThat(module.getState()).containsKey("attempts");
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A1B2C3");
		bomb.setAaBatteryCount(4);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(java.util.Map.of("CAR", true, "NSA", false));
		bomb.setStrikes(1);
		bomb.getPortPlates().add(plate(PortType.DVI, PortType.PARALLEL));
		bomb.getPortPlates().add(plate(PortType.DVI, PortType.RJ45));
		for (int i = 0; i < 3; i++) {
			ModuleEntity module = new ModuleEntity();
			module.setType(ModuleType.MASTERMIND_CRUEL);
			module.setSolved(i < 2);
			bomb.getModules().add(module);
		}
		ModuleEntity needy = new ModuleEntity();
		needy.setType(ModuleType.KNOBS);
		bomb.getModules().add(needy);
		return bomb;
	}

	private static PortPlateEntity plate(PortType... ports) {
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(new LinkedHashSet<>(List.of(ports)));
		return plate;
	}

	private static Attempt encoded(List<String> guess, int[] feedback, int leftColor, int rightColor, BombEntity bomb) {
		int exact = feedback[0];
		int misplaced = feedback[1];
		int absent = 5 - exact - misplaced;
		int[] values = switch (leftColor) {
			case 0 -> new int[] {exact, misplaced};
			case 1 -> new int[] {absent, exact};
			case 2 -> new int[] {misplaced, absent};
			case 3 -> new int[] {misplaced, exact};
			case 4 -> new int[] {absent, misplaced};
			case 5 -> new int[] {exact, absent};
			default -> throw new IllegalArgumentException();
		};
		int[] offsets = switch (rightColor) {
			case 0 -> new int[] {5, 2};
			case 1 -> new int[] {1, 3};
			case 2 -> new int[] {6, 4};
			case 3 -> new int[] {3, 1};
			case 4 -> new int[] {3, 1};
			case 5 -> new int[] {1, 3};
			default -> throw new IllegalArgumentException();
		};
		return new Attempt(guess, COLORS.get(leftColor), values[0] + offsets[0], COLORS.get(rightColor),
			values[1] + offsets[1], 2, bomb.getStrikes());
	}

	private static int[] score(List<String> code, List<String> guess) {
		int exact = 0;
		int[] codeCounts = new int[COLORS.size()];
		int[] guessCounts = new int[COLORS.size()];
		for (int i = 0; i < 5; i++) {
			if (code.get(i).equals(guess.get(i))) exact++;
			else {
				codeCounts[COLORS.indexOf(code.get(i))]++;
				guessCounts[COLORS.indexOf(guess.get(i))]++;
			}
		}
		int misplaced = 0;
		for (int i = 0; i < COLORS.size(); i++) misplaced += Math.min(codeCounts[i], guessCounts[i]);
		return new int[] {exact, misplaced};
	}

	@SuppressWarnings("unchecked")
	private static SolveSuccess<MastermindCruelOutput> success(Object result) {
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return (SolveSuccess<MastermindCruelOutput>) result;
	}
}
