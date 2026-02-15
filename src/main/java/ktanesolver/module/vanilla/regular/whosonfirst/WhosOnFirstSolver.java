
package ktanesolver.module.vanilla.regular.whosonfirst;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo (type = ModuleType.WHOS_ON_FIRST, id = "whos_on_first", name = "Who's on First", category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR, description = "Display the correct word based on the display", tags = {
	"6-buttons", "display", "words", "3-squares"})
public class WhosOnFirstSolver extends AbstractModuleSolver<WhosOnFirstInput, WhosOnFirstOutput> {

	@Override
	public SolveResult<WhosOnFirstOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, WhosOnFirstInput input) {
		WhosOnFirstState state = module.getStateAs(WhosOnFirstState.class, () -> new WhosOnFirstState(new ArrayList<>(), new ArrayList<>(), new ArrayList<>()));

		if (state.buttonPressHistory().size() >= 3) {
			return failure("Module already completed (maximum 3 stages).");
		}

		String display = normalize(input.displayWord());
		ButtonPosition pos = WhosOnFirstDisplayTable.DISPLAY_MAP.get(display);
		if(pos == null) {
			return failure("Unknown display word: " + display);
		}
		String targetWord = normalize(input.buttons().get(pos));
		List<String> priority = WhosOnFirstPriorityTable.PRIORITY_MAP.get(targetWord);

		if(priority == null) {
			return failure("Unknown button word: " + targetWord);
		}

		for(String candidate: priority) {
			if(input.buttons().containsValue(candidate)) {
				Optional<Map.Entry<ButtonPosition, String>> buttonPosition = input.buttons().entrySet().stream().filter(e -> e.getValue().equals(candidate)).findFirst();
				if(buttonPosition.isPresent()) {
					// Create new lists instead of modifying existing ones
					List<String> newDisplayHistory = new ArrayList<>(state.displayHistory());
					newDisplayHistory.add(display);

					List<Map<ButtonPosition, String>> newButtonHistory = new ArrayList<>(state.buttonHistory());
					newButtonHistory.add(input.buttons());

					List<Map<ButtonPosition, String>> newButtonPositions = new ArrayList<>(state.buttonPressHistory());
					newButtonPositions.add(Map.of(buttonPosition.get().getKey(), buttonPosition.get().getValue()));

					module.setState(new WhosOnFirstState(newDisplayHistory, newButtonHistory, newButtonPositions));

					WhosOnFirstOutput whosOnFirstOutput = new WhosOnFirstOutput(buttonPosition.get().getKey(), buttonPosition.get().getValue());
					return success(whosOnFirstOutput, newButtonPositions.size() == 3);
				}
			}
		}
		return failure("No matching button found");
	}

	private String normalize(String s) {
		if(s == null || s.trim().isEmpty()) {
			return " "; // Empty display maps to space
		}
		return s.trim().toUpperCase();
	}
}
