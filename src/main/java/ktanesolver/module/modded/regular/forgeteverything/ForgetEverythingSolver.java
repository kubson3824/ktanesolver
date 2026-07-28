package ktanesolver.module.modded.regular.forgeteverything;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.forgeteverything.ForgetEverythingInput.Action;
import ktanesolver.module.modded.regular.forgeteverything.ForgetEverythingInput.Color;
import ktanesolver.module.modded.regular.forgeteverything.ForgetEverythingState.Stage;

@Service
@ModuleInfo(
	type = ModuleType.FORGET_EVERYTHING,
	id = "HexiEvilFMN",
	name = "Forget Everything",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Record the out-of-order stages and calculate the ten dial positions",
	tags = {"boss", "memory", "dials", "stages"},
	checkFirst = true
)
public class ForgetEverythingSolver extends AbstractModuleSolver<ForgetEverythingInput, ForgetEverythingOutput> {
	@Override
	protected SolveResult<ForgetEverythingOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ForgetEverythingInput input
	) {
		if (input == null || input.action() == null) return failure("Select an action");
		if (input.action() == Action.RESET) {
			module.setState(new ForgetEverythingState(new ArrayList<>(), new ArrayList<>()));
			return success(new ForgetEverythingOutput(null, 0), false);
		}

		ForgetEverythingState state = module.getStateAs(
			ForgetEverythingState.class,
			() -> new ForgetEverythingState(new ArrayList<>(), new ArrayList<>())
		);
		if (input.action() == Action.FINISH) return finish(state);

		String error = validateStage(input);
		if (error != null) return failure(error);

		List<Stage> stages = new ArrayList<>(state.stages());
		stages.removeIf(stage -> stage.number() == input.stage());
		stages.add(new Stage(input.stage(), input.dials(), input.nixies(), List.copyOf(input.colors())));
		stages.sort(Comparator.comparingInt(Stage::number));
		List<Integer> firstStageDigits = stages.getFirst().number() == 1
			? stages.getFirst().dials().chars().map(digit -> digit - '0').boxed().toList()
			: List.of();
		module.setState(new ForgetEverythingState(stages, firstStageDigits));
		return success(new ForgetEverythingOutput(null, stages.size()), false);
	}

	private SolveResult<ForgetEverythingOutput> finish(ForgetEverythingState state) {
		if (state.stages().isEmpty()) return failure("Record stage 1 before calculating the solution");
		for (int index = 0; index < state.stages().size(); index++) {
			if (state.stages().get(index).number() != index + 1) {
				return failure("Record every stage from 1 through " + state.stages().getLast().number());
			}
		}

		int[] solution = state.stages().getFirst().dials().chars().map(digit -> digit - '0').toArray();
		boolean[] valid = new boolean[state.stages().size()];
		valid[0] = true;
		for (int index = 1; index < state.stages().size(); index++) {
			Stage stage = state.stages().get(index);
			valid[index] = index >= 2 && valid[index - 1] == valid[index - 2]
				? !valid[index - 1]
				: stage.nixies().chars().allMatch(nixie -> stage.dials().indexOf(nixie) >= 0);
			if (!valid[index]) continue;

			int position = (stage.number() - 1) % 10;
			int previous = solution[position];
			int current = stage.dials().charAt(position) - '0';
			solution[position] = Math.floorMod(switch (stageColor(stage.colors())) {
				case RED -> previous + current;
				case YELLOW -> previous - current;
				case GREEN -> previous + current + 5;
				case BLUE -> current - previous;
			}, 10);
		}

		String answer = java.util.Arrays.stream(solution).mapToObj(String::valueOf).collect(java.util.stream.Collectors.joining());
		return success(new ForgetEverythingOutput(answer, state.stages().size()));
	}

	private static String validateStage(ForgetEverythingInput input) {
		if (input.stage() == null || input.stage() < 1 || input.stage() > 99) return "Stage number must be from 1 to 99";
		if (input.dials() == null || !input.dials().matches("\\d{10}")) return "Enter exactly 10 dial digits";
		if (input.nixies() == null || !input.nixies().matches("\\d{2}")) return "Enter exactly 2 nixie digits";
		if (input.colors() == null || input.colors().size() != 3 || input.colors().stream().anyMatch(color -> color == null)) {
			return "Select all 3 light colors";
		}
		return null;
	}

	private static Color stageColor(List<Color> colors) {
		return colors.stream().distinct().count() == 3
			? List.of(Color.RED, Color.YELLOW, Color.GREEN, Color.BLUE).stream()
				.filter(color -> !colors.contains(color)).findFirst().orElseThrow()
			: colors.stream().filter(color -> colors.indexOf(color) != colors.lastIndexOf(color)).findFirst().orElseThrow();
	}
}
