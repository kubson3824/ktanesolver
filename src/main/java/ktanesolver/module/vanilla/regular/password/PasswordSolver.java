
package ktanesolver.module.vanilla.regular.password;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class PasswordSolver implements ModuleSolver<PasswordInput, PasswordOutput> {

	@Override
	public ModuleType getType() {
		return ModuleType.PASSWORDS;
	}

	@Override
	public Class<PasswordInput> inputType() {
		return PasswordInput.class;
	}
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("passwords", "Passwords", ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
			"PASSWORDS", List.of("puzzle", "word"),
			"Find the correct password from the list", true, true);
	}

	@Override
	public SolveResult<PasswordOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, PasswordInput input) {
		Map<Integer, Set<Character>> columns = normalize(input.letters());

		List<String> possible = Arrays.stream(PasswordWord.values()).map(Enum::name).filter(word -> matches(word, columns)).toList();

		boolean solved = possible.size() == 1;
		if(solved) {
			module.setSolved(true);
		}

		return new SolveSuccess<>(new PasswordOutput(possible, solved), solved);
	}

	// ----------------------------------------------------

	private boolean matches(String word, Map<Integer, Set<Character>> columns) {
		for(Map.Entry<Integer, Set<Character>> e: columns.entrySet()) {
			int idx = e.getKey() - 1;
			if(idx < 0 || idx >= 5)
				continue;

			Set<Character> allowed = e.getValue();
			if(allowed == null || allowed.isEmpty())
				continue;

			if( !allowed.contains(word.charAt(idx))) {
				return false;
			}
		}
		return true;
	}

	private Map<Integer, Set<Character>> normalize(Map<Integer, Set<Character>> input) {
		if(input == null || input.isEmpty()) {
			return Map.of();
		}

		Map<Integer, Set<Character>> out = new HashMap<>();
		for(var e: input.entrySet()) {
			out.put(e.getKey(), e.getValue().stream().map(Character::toUpperCase).collect(Collectors.toSet()));
		}
		return out;
	}
}
