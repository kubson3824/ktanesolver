
package ktanesolver.module.vanilla.regular.wires.sequence;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;

import java.util.ArrayList;
import java.util.List;

import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo(
		type = ModuleType.WIRE_SEQUENCES,
		id = "wire_sequences",
		name = "Wire Sequences",
		category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
		description = "Cut wires in the correct order based on previous wires",
		tags = {"memory", "pattern"}
)
public class WireSequencesSolver extends AbstractModuleSolver<WireSequenceInput, WireSequenceOutput> {

	@Override
	public SolveResult<WireSequenceOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, WireSequenceInput input) {
		WireSequenceState state = module.getStateAs(WireSequenceState.class, () -> new WireSequenceState(0, 0, 0, new ArrayList<>()));

		int red = state.red();
		int blue = state.blue();
		int black = state.black();

		List<Boolean> cut = new ArrayList<>();

		for (int i = 0; i < input.wires().size(); i++) {
			WireSequenceCombo wire = input.wires().get(i);
			switch(wire.color()) {
				case RED -> {
					red++;
					cut.add(shouldCutRed(red, wire.letter()));
				}
				case BLUE -> {
					blue++;
					cut.add(shouldCutBlue(blue, wire.letter()));
				}
				case BLACK -> {
					black++;
					cut.add(shouldCutBlack(black, wire.letter()));
				}
				default -> throw new IllegalStateException();
			}
		}

		List<WireSequenceCombo> history = state.history();
		history.addAll(input.wires());
		WireSequenceState newState = new WireSequenceState(red, blue, black, history);
		storeTypedState(module, newState);
		boolean solved = input.stage() == 4;

		WireSequenceOutput wireSequenceOutput = new WireSequenceOutput(cut);

		return success(wireSequenceOutput, solved);
	}

	// ----------------------------------------------------

	private boolean shouldCutRed(int n, char l) {
		return switch(n) {
			case 1 -> l == 'C';
			case 2, 5, 9 -> l == 'B';
			case 3 -> l == 'A';
			case 4, 6 -> l == 'A' || l == 'C';
            case 7 -> l == 'A' || l == 'B' || l == 'C';
			case 8 -> l == 'A' || l == 'B';
            default -> false;
		};
	}

	private boolean shouldCutBlue(int n, char l) {
		return switch(n) {
			case 1, 3, 5 -> l == 'B';
			case 2, 8 -> l == 'A' || l == 'C';
            case 4, 9 -> l == 'A';
            case 6 -> l == 'B' || l == 'C';
			case 7 -> l == 'C';
            default -> false;
		};
	}

	private boolean shouldCutBlack(int n, char l) {
		return switch(n) {
			case 1 -> true;
			case 2, 4 -> l == 'A' || l == 'C';
			case 3, 5 -> l == 'B';
            case 6 -> l == 'B' || l == 'C';
			case 7 -> l == 'A' || l == 'B';
			case 8, 9 -> l == 'C';
            default -> false;
		};
	}
}
