package ktanesolver.module.modded.regular.simonsings;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

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
	type = ModuleType.SIMON_SINGS,
	id = "SimonSingsModule",
	name = "Simon Sings",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Translate three eight-color piano sequences into alternating key presses",
	tags = {"simon", "piano", "binary", "sequence", "stages", "edgework", "modded"}
)
public class SimonSingsSolver extends AbstractModuleSolver<SimonSingsInput, SimonSingsOutput> {
	private static final List<String> NOTES = List.of("C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B");
	private static final Set<String> SHARPS = Set.of("C♯", "D♯", "F♯", "G♯", "A♯");
	private static final Set<Integer> PRIMES = Set.of(2, 3, 5, 7, 11, 13);

	@Override
	protected SolveResult<SimonSingsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SimonSingsInput input
	) {
		if (input == null || input.flashes() == null || input.flashes().size() != 8) {
			return failure("Enter exactly 8 flashing key colors in order");
		}
		if (input.flashes().stream().anyMatch(note -> !NOTES.contains(note)) || Set.copyOf(input.flashes()).size() != 8) {
			return failure("Select 8 distinct piano notes from C through B");
		}
		if (bomb.getSerialNumber() == null || bomb.getSerialNumber().isBlank()) return failure("The bomb needs a serial number");

		SimonSingsState state = module.getStateAs(SimonSingsState.class, SimonSingsState::empty);
		List<List<String>> flashHistory = state.flashHistory() == null ? List.of() : state.flashHistory();
		if (flashHistory.size() >= 3) return failure("All Simon Sings stages are already complete");

		int stage = flashHistory.size() + 1;
		List<Integer> bits = bitsFor(input.flashes(), stage, state, bomb);
		int first = number(bits, 0);
		int second = number(bits, 4);

		List<List<String>> pressHistory = state.pressHistory() == null ? List.of() : state.pressHistory();
		List<String> press = new ArrayList<>(pressHistory.isEmpty() ? List.of() : pressHistory.getLast());
		boolean leftFirst = bomb.serialHasVowel();
		press.add((leftFirst ? "left " : "right ") + keyFor(first, input.flashes(), 0));
		press.add((leftFirst ? "right " : "left ") + keyFor(second, input.flashes(), 4));

		List<List<String>> newFlashes = new ArrayList<>(flashHistory);
		newFlashes.add(List.copyOf(input.flashes()));
		List<List<Integer>> newNumbers = new ArrayList<>(state.numberHistory() == null ? List.of() : state.numberHistory());
		newNumbers.add(List.of(first, second));
		List<List<String>> newPresses = new ArrayList<>(pressHistory);
		newPresses.add(List.copyOf(press));
		module.setState(new SimonSingsState(newFlashes, newNumbers, newPresses));

		return success(new SimonSingsOutput(stage, List.copyOf(press)), stage == 3);
	}

	private static List<Integer> bitsFor(List<String> flashes, int stage, SimonSingsState state, BombEntity bomb) {
		List<Integer> bits = new ArrayList<>(Collections.nCopies(8, 0));
		for (int i = 0; i < flashes.size(); i++) if (!"B".equals(flashes.get(i))) {
			bits.set(i, rule(flashes.get(i), flashes, i, stage, state, bits, bomb) ? 1 : 0);
		}
		for (int i = 0; i < flashes.size(); i++) if ("B".equals(flashes.get(i))) {
			List<Integer> candidate = new ArrayList<>(bits);
			candidate.set(i, 1);
			bits.set(i, PRIMES.contains(number(candidate, i / 4 * 4)) ? 1 : 0);
		}
		return bits;
	}

	private static boolean rule(
		String note, List<String> flashes, int index, int stage, SimonSingsState state, List<Integer> bits, BombEntity bomb
	) {
		int position = index % 4 + 1;
		return switch (note) {
			case "C" -> position == 1 || position == 4;
			case "C♯" -> position == 2 || position == 3;
			case "D" -> index == 0 ? bomb.isLastDigitOdd() : bits.get(index - 1) == 0;
			case "D♯" -> position == bomb.getPortPlates().size();
			case "E" -> bomb.getPortPlates().isEmpty()
				? bomb.getBatteryCount() % 2 == 1
				: position == bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).max().orElse(0);
			case "F" -> stage == 3;
			case "F♯" -> stage == bomb.getSerialNumber().chars().filter(Character::isLetter).count() - 1;
			case "G" -> position == 1 ? bomb.getIndicators().size() % 2 == 1 : SHARPS.contains(flashes.get(index / 4 * 4));
			case "G♯" -> stage == 1 ? portCount(bomb) % 2 == 1 : consecutiveSharps(state.flashHistory().get(stage - 2));
			case "A" -> stage == 1 ? bomb.getIndicators().size() % 2 == 0
				: state.numberHistory().get(stage - 2).stream().anyMatch(value -> value < 5);
			case "A♯" -> flashes.subList(index / 4 * 4, index / 4 * 4 + 4).stream().anyMatch(value -> value.equals("F") || value.equals("F♯"));
			default -> false;
		};
	}

	private static int portCount(BombEntity bomb) {
		return bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
	}

	private static boolean consecutiveSharps(List<String> flashes) {
		for (int i = 0; i < flashes.size() - 1; i++) if (SHARPS.contains(flashes.get(i)) && SHARPS.contains(flashes.get(i + 1))) return true;
		return false;
	}

	private static int number(List<Integer> bits, int start) {
		int value = 0;
		for (int i = start; i < start + 4; i++) value = value << 1 | bits.get(i);
		return value;
	}

	private static String keyFor(int number, List<String> flashes, int start) {
		return number < 12 ? NOTES.get(number) : flashes.get(start + number - 12);
	}

	private record SimonSingsState(
		List<List<String>> flashHistory,
		List<List<Integer>> numberHistory,
		List<List<String>> pressHistory
	) {
		private static SimonSingsState empty() {
			return new SimonSingsState(new ArrayList<>(), new ArrayList<>(), new ArrayList<>());
		}
	}
}
