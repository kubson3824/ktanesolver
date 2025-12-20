
package ktanesolver.module.vanilla.regular.memory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;

@Service
public class MemorySolver implements ModuleSolver<MemoryInput, MemoryOutput> {

	@Override
	public ModuleType getType() {
		return ModuleType.MEMORY;
	}

	@Override
	public Class<MemoryInput> inputType() {
		return MemoryInput.class;
	}

	@Override
	public SolveResult<MemoryOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, MemoryInput input) {
		MemoryState state = module.getStateAs(MemoryState.class, () -> new MemoryState(new ArrayList<>(), new ArrayList<>()));

		if(input.stage() != state.displayHistory().size() + 1) {
			return new SolveFailure<>("Invalid stage order");
		}

		MemoryDecision decision = decide(input, state);

		List<Integer> newDisplayHistory = new ArrayList<>(state.displayHistory());
		newDisplayHistory.add(input.display());

		List<MemoryStep> newHistory = new ArrayList<>(state.solutionHistory());
		newHistory.add(new MemoryStep(decision.position(), decision.label()));

		MemoryState newState = new MemoryState(newDisplayHistory, newHistory);

		module.setState(newState);
		module.setSolved(input.stage() == 5);
		MemoryOutput memoryOutput = new MemoryOutput(decision.position(), decision.label());
		Json.mapper().convertValue(memoryOutput, new TypeReference<Map<String, Object>>() {
		}).forEach(module.getSolution()::put);

		return new SolveSuccess<>(memoryOutput, module.isSolved());
	}

	// ------------------------------------------------------

	private MemoryDecision decide(MemoryInput input, MemoryState state) {
		return switch(input.stage()) {
			case 1 -> stage1(input);
			case 2 -> stage2(input, state);
			case 3 -> stage3(input, state);
			case 4 -> stage4(input, state);
			case 5 -> stage5(input, state);
			default -> throw new IllegalStateException();
		};
	}

	// ---------- Stage rules ----------

	private MemoryDecision stage1(MemoryInput input) {
		return switch(input.display()) {
			case 1, 2 -> pressPosition(input, 2);
			case 3 -> pressPosition(input, 3);
			case 4 -> pressPosition(input, 4);
			default -> throw new IllegalArgumentException();
		};
	}

	private MemoryDecision stage2(MemoryInput input, MemoryState state) {
		return switch(input.display()) {
			case 1 -> pressLabel(input, 4);
			case 2, 4 -> pressPosition(input, state.solutionHistory().get(0).position());
			case 3 -> pressPosition(input, 1);
			default -> throw new IllegalArgumentException();
		};
	}

	private MemoryDecision stage3(MemoryInput input, MemoryState state) {
		return switch(input.display()) {
			case 1 -> pressLabel(input, state.solutionHistory().get(1).label());
			case 2 -> pressLabel(input, state.solutionHistory().get(0).label());
			case 3 -> pressPosition(input, 3);
			case 4 -> pressLabel(input, 4);
			default -> throw new IllegalArgumentException();
		};
	}

	private MemoryDecision stage4(MemoryInput input, MemoryState state) {
		return switch(input.display()) {
			case 1 -> pressPosition(input, state.solutionHistory().get(0).position());
			case 2 -> pressPosition(input, 1);
			case 3, 4 -> pressPosition(input, state.solutionHistory().get(1).position());
			default -> throw new IllegalArgumentException();
		};
	}

	private MemoryDecision stage5(MemoryInput input, MemoryState state) {
		return switch(input.display()) {
			case 1 -> pressLabel(input, state.solutionHistory().get(0).label());
			case 2 -> pressLabel(input, state.solutionHistory().get(1).label());
			case 3 -> pressLabel(input, state.solutionHistory().get(3).label());
			case 4 -> pressLabel(input, state.solutionHistory().get(2).label());
			default -> throw new IllegalArgumentException();
		};
	}

	// ---------- Helpers ----------

	private MemoryDecision pressPosition(MemoryInput input, int position) {
		int label = input.labels().get(position - 1);
		return new MemoryDecision(position, label);
	}

	private MemoryDecision pressLabel(MemoryInput input, int label) {
		int index = input.labels().indexOf(label);
		return new MemoryDecision(index + 1, label);
	}

	// ---------- Internal DTO ----------

	private record MemoryDecision(int position, int label) {
	}
}
