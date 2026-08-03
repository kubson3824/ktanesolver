package ktanesolver.module.modded.regular.complexkeypad;

import static ktanesolver.module.modded.regular.complexkeypad.ComplexKeypadInput.Symbol.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.complexkeypad.ComplexKeypadInput.Symbol;

@Service
@ModuleInfo(
	type = ModuleType.COMPLEX_KEYPAD,
	id = "complexKeypad",
	name = "Complex Keypad",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Press nine symbols in chart order, with edgework exceptions",
	tags = {"symbols", "keypad", "edgework"}
)
public class ComplexKeypadSolver extends AbstractModuleSolver<ComplexKeypadInput, ComplexKeypadOutput> {
	private static final List<List<Symbol>> ROWS = List.of(
		List.of(ALPHA, EPSILON, THETA, PSI, MU, XI, ZETA, SIGMA, BETA, UPPER_DELTA),
		List.of(PI, ALPHA, ZETA, OMEGA, LOWER_DELTA, GAMMA, ETA, ARABIC_MEEM, HORSESHOE, KAPPA),
		List.of(PHI, KAPPA, OMEGA, GAMMA, THETA, BETA, EPSILON, PI, HEBREW_NUN, UPPER_DELTA),
		List.of(HEBREW_NUN, ARABIC_MEEM, PHI, EPSILON, MU, OMEGA, ALPHA, SIGMA, KAPPA, ARABIC_NOON),
		List.of(GAMMA, OMEGA, MU, LOWER_DELTA, ARABIC_NOON, HORSESHOE, XI, ALPHA, ETA, BETA)
	);

	@Override
	protected SolveResult<ComplexKeypadOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ComplexKeypadInput input
	) {
		if (bomb.getBatteryCount() > 2 && bomb.hasPort(PortType.PARALLEL)) {
			return solved(module, IntStream.rangeClosed(1, 9).boxed().toList(), "READING_ORDER", 0);
		}

		List<Symbol> symbols = input == null ? null : input.symbols();
		if (symbols == null || symbols.size() != 9) {
			return failure("Complex Keypad requires exactly 9 symbols");
		}
		if (symbols.stream().anyMatch(Objects::isNull) || new HashSet<>(symbols).size() != 9) {
			return failure("Symbols must be known and unique");
		}

		List<Integer> matchingRows = IntStream.range(0, ROWS.size())
			.filter(index -> ROWS.get(index).containsAll(symbols))
			.boxed()
			.toList();
		if (matchingRows.size() != 1) {
			return failure("The symbols do not match exactly one chart row");
		}

		int rowIndex = matchingRows.getFirst();
		List<Symbol> chartOrder = new ArrayList<>(ROWS.get(rowIndex));
		String rule = "CHART_FORWARD";
		if (bomb.hasPort(PortType.DVI) && bomb.isIndicatorLit("BOB")) {
			Collections.reverse(chartOrder);
			rule = "CHART_REVERSE";
		}

		List<Integer> positions = chartOrder.stream()
			.filter(symbols::contains)
			.map(symbol -> symbols.indexOf(symbol) + 1)
			.toList();
		return solved(module, positions, rule, rowIndex + 1);
	}

	private SolveResult<ComplexKeypadOutput> solved(
		ModuleEntity module, List<Integer> positions, String rule, int row
	) {
		storeState(module, "rule", rule);
		if (row > 0) storeState(module, "chartRow", row);
		return success(new ComplexKeypadOutput(positions, rule));
	}
}
