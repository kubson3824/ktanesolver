package ktanesolver.module.modded.regular.symbolcycle;

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
import ktanesolver.module.modded.regular.symbolcycle.SymbolCycleInput.Mode;
import ktanesolver.module.modded.regular.symbolcycle.SymbolCycleInput.Screen;

@Service
@ModuleInfo(
	type = ModuleType.SYMBOL_CYCLE,
	id = "symbol-cycle",
	name = "Symbol Cycle",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Reconstruct the symbols or cycle number after the switch is flipped.",
	tags = {"symbols", "cycles", "memory", "Souvenir"}
)
public class SymbolCycleSolver extends AbstractModuleSolver<SymbolCycleInput, SymbolCycleOutput> {
	@Override
	protected SolveResult<SymbolCycleOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SymbolCycleInput input
	) {
		if (input == null || input.mode() == null) return failure("Select the module state");
		if (input.referenceCycle() < 0 || input.displayedCycle() < 0) return failure("Cycle numbers cannot be negative");
		if (!validCycle(input.leftCycle()) || !validCycle(input.rightCycle())) return failure("Each cycle needs 2 to 5 unique symbol names");
		if (input.leftCycle().stream().anyMatch(input.rightCycle()::contains)) return failure("Use a different symbol name for every symbol");
		if (gcd(input.leftCycle().size(), input.rightCycle().size()) != 1) return failure("Symbol Cycle screen lengths must be coprime");

		SymbolCycleOutput output = input.mode() == Mode.RETROTRANSPHASIC ? retro(input) : antero(input);
		if (output == null) return failure(input.mode() == Mode.RETROTRANSPHASIC
			? "Enter each screen's complete selectable cycle, starting with its current symbol"
			: "Select the two displayed symbols and the screen that increments the number");

		storeState(module, "input", input);
		storeState(module, "leftCycleLength", input.leftCycle().size());
		storeState(module, "rightCycleLength", input.rightCycle().size());
		return success(output);
	}

	private static SymbolCycleOutput retro(SymbolCycleInput input) {
		if (!validSelectable(input.leftSelectable(), input.leftCycle()) || !validSelectable(input.rightSelectable(), input.rightCycle())) return null;
		String left = symbolAt(input.leftCycle(), input.referenceCycle(), input.displayedCycle());
		String right = symbolAt(input.rightCycle(), input.referenceCycle(), input.displayedCycle());
		return new SymbolCycleOutput(Mode.RETROTRANSPHASIC, left, right, null, null, null,
			input.leftSelectable().indexOf(left), input.rightSelectable().indexOf(right));
	}

	private static SymbolCycleOutput antero(SymbolCycleInput input) {
		if (input.incrementScreen() == null || !input.leftCycle().contains(input.leftSymbol()) || !input.rightCycle().contains(input.rightSymbol())) return null;
		int leftResidue = Math.floorMod(input.leftCycle().indexOf(input.leftSymbol()) + input.referenceCycle(), input.leftCycle().size());
		int rightResidue = Math.floorMod(input.rightCycle().indexOf(input.rightSymbol()) + input.referenceCycle(), input.rightCycle().size());
		int period = input.leftCycle().size() * input.rightCycle().size();
		long targetResidue = 0;
		while (targetResidue % input.leftCycle().size() != leftResidue || targetResidue % input.rightCycle().size() != rightResidue) targetResidue++;
		int up = Math.floorMod(targetResidue - input.displayedCycle(), period);
		int down = period - up;
		boolean increment = up <= down;
		int clicks = increment ? up : down;
		Screen screen = increment ? input.incrementScreen() : opposite(input.incrementScreen());
		long target = input.displayedCycle() + (increment ? clicks : -clicks);
		return new SymbolCycleOutput(Mode.ANTERODIAMETRIC, input.leftSymbol(), input.rightSymbol(), target, screen, clicks, null, null);
	}

	private static boolean validCycle(List<String> cycle) {
		return cycle != null && cycle.size() >= 2 && cycle.size() <= 5
			&& cycle.stream().allMatch(value -> value != null && !value.isBlank())
			&& cycle.stream().distinct().count() == cycle.size();
	}

	private static boolean validSelectable(List<String> selectable, List<String> cycle) {
		return selectable != null && selectable.size() >= cycle.size() + 1 && selectable.size() <= cycle.size() + 3
			&& selectable.stream().allMatch(value -> value != null && !value.isBlank())
			&& selectable.stream().distinct().count() == selectable.size()
			&& selectable.containsAll(cycle);
	}

	private static String symbolAt(List<String> cycle, long reference, long target) {
		return cycle.get(Math.floorMod(target - reference, cycle.size()));
	}

	private static int gcd(int a, int b) {
		while (b != 0) { int next = a % b; a = b; b = next; }
		return a;
	}

	private static Screen opposite(Screen screen) {
		return screen == Screen.LEFT ? Screen.RIGHT : Screen.LEFT;
	}
}
