
package ktanesolver.module.vanilla.regular.password;

import java.util.*;

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
@ModuleInfo (type = ModuleType.PASSWORDS, id = "passwords", name = "Passwords", category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR, description = "Find the correct password from the list", tags = {
	"green", "5-up-arrows", "5-down-arrows", "submit"})
public class PasswordSolver extends AbstractModuleSolver<PasswordInput, PasswordOutput> {

	@Override
	public SolveResult<PasswordOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, PasswordInput input) {
		if(input == null) return failure("Enter the visible password letters");
		String language;
		try {
			language = TranslatedVanillaData.language(input.language());
		} catch(IllegalArgumentException exception) {
			return failure(exception.getMessage());
		}
		Map<Integer, Set<String>> columns = normalize(input.letters());

		List<String> possible = TranslatedVanillaData.passwordWords(language).stream().filter(word -> matches(word, columns)).toList();

		boolean solved = possible.size() == 1;
		storeState(module, "input", input);
		return success(new PasswordOutput(possible, solved), solved);
	}

	// ----------------------------------------------------

	private boolean matches(String word, Map<Integer, Set<String>> columns) {
		for(Map.Entry<Integer, Set<String>> e: columns.entrySet()) {
			int idx = e.getKey() - 1;
			if(idx < 0 || idx >= 5)
				continue;

			Set<String> allowed = e.getValue();
			if(allowed == null || allowed.isEmpty())
				continue;

			if(!allowed.contains(TranslatedVanillaData.normalize(word.substring(idx, idx + 1)))) {
				return false;
			}
		}
		return true;
	}

	private Map<Integer, Set<String>> normalize(Map<Integer, Set<String>> input) {
		if(input == null || input.isEmpty()) {
			return Map.of();
		}

		Map<Integer, Set<String>> out = new HashMap<>();
		for(var e: input.entrySet()) {
			if(e.getKey() >= 1 && e.getKey() <= 5 && e.getValue() != null)
				out.put(e.getKey(), e.getValue().stream().filter(Objects::nonNull).map(TranslatedVanillaData::normalize).collect(java.util.stream.Collectors.toSet()));
		}
		return out;
	}
}
