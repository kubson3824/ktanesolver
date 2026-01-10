
package ktanesolver.module.vanilla.regular.wires.sequence;

import com.fasterxml.jackson.core.type.TypeReference;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class WireSequencesSolver implements ModuleSolver<WireSequenceInput, WireSequenceOutput> {

	@Override
	public ModuleType getType() {
		return ModuleType.WIRE_SEQUENCES;
	}

	@Override
	public Class<WireSequenceInput> inputType() {
		return WireSequenceInput.class;
	}
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("wire_sequences", "Wire Sequences", ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
			"WIRE_SEQUENCES", List.of("memory", "pattern"),
			"Cut wires in the correct order based on previous wires", true, true);
	}

	@Override
	public SolveResult<WireSequenceOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, WireSequenceInput input) {
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
		module.setState(newState);
		boolean solved = false;

		WireSequenceOutput wireSequenceOutput = new WireSequenceOutput(cut);
		if(input.stage() == 4){
			solved = true;
			Json.mapper().convertValue(wireSequenceOutput, new TypeReference<Map<String, Object>>() {
			}).forEach(module.getSolution()::put);
		}

		module.setSolved(solved);
		return new SolveSuccess<>(wireSequenceOutput, solved);
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
