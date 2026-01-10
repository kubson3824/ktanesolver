
package ktanesolver.module.vanilla.regular.whosonfirst;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class WhosOnFirstSolver implements ModuleSolver<WhosOnFirstInput, WhosOnFirstOutput> {

	@Override
	public ModuleType getType() {
		return ModuleType.WHOS_ON_FIRST;
	}

	@Override
	public Class<WhosOnFirstInput> inputType() {
		return WhosOnFirstInput.class;
	}
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("whos_on_first", "Who's on First", ModuleCatalogDto.ModuleCategory.VANILLA_NEEDY,
			"WHOS_ON_FIRST", List.of("word", "logic"),
			"Display the correct word based on the display", true, true);
	}

	@Override
	public SolveResult<WhosOnFirstOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, WhosOnFirstInput input) {
		WhosOnFirstState state = module.getStateAs(WhosOnFirstState.class, () -> new WhosOnFirstState(new ArrayList<>(), new ArrayList<>(), new ArrayList<>()));

		String display = normalize(input.displayWord());
		ButtonPosition pos = WhosOnFirstDisplayTable.DISPLAY_MAP.get(display);
		if(pos == null) {
			return new SolveFailure<>("Unknown display word: " + display);
		}
		String targetWord = normalize(input.buttons().get(pos));
		List<String> priority = WhosOnFirstPriorityTable.PRIORITY_MAP.get(targetWord);

		if(priority == null) {
			return new SolveFailure<>("Unknown button word: " + targetWord);
		}

		for(String candidate: priority) {
			if(input.buttons().containsValue(candidate)) {
				Optional<Map.Entry<ButtonPosition, String>> buttonPosition = input.buttons().entrySet().stream().filter(e -> e.getValue().equals(candidate)).findFirst();
				if(buttonPosition.isPresent()) {
					List<String> displayHistory = state.displayHistory();
					displayHistory.add(display);
					List<Map<ButtonPosition, String>> buttonHistory = state.buttonHistory();
					buttonHistory.add(input.buttons());
					List<Map<ButtonPosition, String>> buttonPositions = state.buttonPressHistory();
					buttonPositions.add(Map.of(buttonPosition.get().getKey(), buttonPosition.get().getValue()));
					module.setState(new WhosOnFirstState(displayHistory, buttonHistory, buttonPositions));
					WhosOnFirstOutput whosOnFirstOutput = new WhosOnFirstOutput(buttonPosition.get().getKey(), buttonPosition.get().getValue());
					Json.mapper().convertValue(whosOnFirstOutput, new TypeReference<Map<String, Object>>() {
					}).forEach(module.getSolution()::put);
					if(buttonPositions.size() == 3) {
						module.setSolved(true);
						return new SolveSuccess<>(whosOnFirstOutput, true);
					}
					return new SolveSuccess<>(whosOnFirstOutput, false);
				}
			}
		}

		return new SolveFailure<>("No matching button found");
	}

	private String normalize(String s) {
		if (s == null || s.trim().isEmpty()) {
			return " "; // Empty display maps to space
		}
		return s.trim().toUpperCase();
	}
}
