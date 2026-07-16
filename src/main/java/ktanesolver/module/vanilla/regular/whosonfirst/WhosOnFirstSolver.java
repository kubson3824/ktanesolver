
package ktanesolver.module.vanilla.regular.whosonfirst;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.EnumMap;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.module.vanilla.regular.translated.TranslatedVanillaData;

@Service
@ModuleInfo (type = ModuleType.WHOS_ON_FIRST, id = "whos_on_first", name = "Who's on First", category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR, description = "Display the correct word based on the display", tags = {
	"6-buttons", "display", "words", "3-squares"})
public class WhosOnFirstSolver extends AbstractModuleSolver<WhosOnFirstInput, WhosOnFirstOutput> {

	@Override
	public SolveResult<WhosOnFirstOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, WhosOnFirstInput input) {
		WhosOnFirstState state = module.getStateAs(WhosOnFirstState.class, () -> new WhosOnFirstState(new ArrayList<>(), new ArrayList<>(), new ArrayList<>()));
		if(input == null || input.buttons() == null || input.buttons().size() != ButtonPosition.values().length)
			return failure("Enter all six button labels");

		String language;
		try {
			language = TranslatedVanillaData.language(input.language());
		} catch(IllegalArgumentException exception) {
			return failure(exception.getMessage());
		}

		if (state.buttonPressHistory().size() >= 3) {
			return failure("Module already completed (maximum 3 stages).");
		}

		String display = TranslatedVanillaData.canonicalWhosOnFirstDisplay(language, input.displayWord());
		if(display == null) return failure("Unknown " + language + " display word: " + input.displayWord());
		ButtonPosition pos = WhosOnFirstDisplayTable.DISPLAY_MAP.get(display);
		Map<ButtonPosition, String> canonicalButtons = new EnumMap<>(ButtonPosition.class);
		Map<ButtonPosition, String> shownButtons = new EnumMap<>(ButtonPosition.class);
		for(ButtonPosition position : ButtonPosition.values()) {
			String shown = input.buttons().get(position);
			String canonical = TranslatedVanillaData.canonicalWhosOnFirstLabel(language, shown);
			if(canonical == null) return failure("Unknown " + language + " button word: " + shown);
			canonicalButtons.put(position, canonical);
			shownButtons.put(position, TranslatedVanillaData.normalize(shown));
		}
		String targetWord = canonicalButtons.get(pos);
		List<String> priority = WhosOnFirstPriorityTable.PRIORITY_MAP.get(targetWord);

		if(priority == null) {
			return failure("Unknown button word: " + targetWord);
		}

		for(String candidate: priority) {
			if(canonicalButtons.containsValue(candidate)) {
				Optional<Map.Entry<ButtonPosition, String>> buttonPosition = canonicalButtons.entrySet().stream().filter(e -> e.getValue().equals(candidate)).findFirst();
				if(buttonPosition.isPresent()) {
					// Create new lists instead of modifying existing ones
					List<String> newDisplayHistory = new ArrayList<>(state.displayHistory());
					newDisplayHistory.add(display);

					List<Map<ButtonPosition, String>> newButtonHistory = new ArrayList<>(state.buttonHistory());
					newButtonHistory.add(Map.copyOf(shownButtons));

					List<Map<ButtonPosition, String>> newButtonPositions = new ArrayList<>(state.buttonPressHistory());
					String shown = shownButtons.get(buttonPosition.get().getKey());
					newButtonPositions.add(Map.of(buttonPosition.get().getKey(), shown));

					module.setState(new WhosOnFirstState(newDisplayHistory, newButtonHistory, newButtonPositions, language));

					WhosOnFirstOutput whosOnFirstOutput = new WhosOnFirstOutput(buttonPosition.get().getKey(), shown);
					return success(whosOnFirstOutput, newButtonPositions.size() == 3);
				}
			}
		}
		return failure("No matching button found");
	}

}
