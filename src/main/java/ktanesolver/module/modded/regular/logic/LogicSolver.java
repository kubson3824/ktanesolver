
package ktanesolver.module.modded.regular.logic;

import java.util.ArrayList;
import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.LOGIC,
	id = "logic",
	name = "Logic",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Evaluate logical statements per row and submit True/False for each.",
	tags = { "logic", "modded" }
)
public class LogicSolver extends AbstractModuleSolver<LogicInput, LogicOutput> {

	@Override
	protected SolveResult<LogicOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, LogicInput input) {
		if (input.rows() == null || input.rows().isEmpty()) {
			return failure("At least one row is required");
		}
		List<Boolean> answers = new ArrayList<>();
		for (LogicRowInput row : input.rows()) {
			boolean s1 = evaluateStatement(bomb, row.letter1());
			if (row.negated1()) s1 = !s1;
			boolean s2 = evaluateStatement(bomb, row.letter2());
			if (row.negated2()) s2 = !s2;
			boolean s3 = evaluateStatement(bomb, row.letter3());
			if (row.negated3()) s3 = !s3;

			boolean result = row.leftGrouped()
				? apply(row.connective2(), apply(row.connective1(), s1, s2), s3)
				: apply(row.connective1(), s1, apply(row.connective2(), s2, s3));
			answers.add(result);
		}
		storeState(module, "input", input);
		return success(new LogicOutput(answers));
	}

	private boolean evaluateStatement(BombEntity bomb, char letter) {
		return switch (Character.toUpperCase(letter)) {
			case 'A' -> bomb.getBatteryCount() == bomb.getIndicators().size();
			case 'B' -> BombEdgeworkUtils.serialHasMoreLettersThanDigits(bomb);
			case 'C' -> bomb.hasIndicator("IND");
			case 'D' -> bomb.hasIndicator("FRK");
			case 'E' -> BombEdgeworkUtils.getUnlitIndicatorCount(bomb) == 1;
			case 'F' -> BombEdgeworkUtils.getDistinctPortTypeCount(bomb) > 1;
			case 'G' -> bomb.getBatteryCount() >= 2;
			case 'H' -> bomb.getBatteryCount() < 2;
			case 'I' -> bomb.isLastDigitOdd();
			case 'J' -> bomb.getBatteryCount() > 4;
			case 'K' -> BombEdgeworkUtils.getLitIndicatorCount(bomb) == 1;
			case 'L' -> bomb.getIndicators().size() > 2;
			case 'M' -> !BombEdgeworkUtils.hasDuplicatePorts(bomb);
			case 'N' -> bomb.getBatteryHolders() > 2;
			case 'O' -> BombEdgeworkUtils.hasBothLitAndUnlitIndicators(bomb);
			case 'P' -> bomb.hasPort(PortType.PARALLEL);
			case 'Q' -> BombEdgeworkUtils.getTotalPortCount(bomb) == 2;
			case 'R' -> bomb.hasPort(PortType.PS2);
			case 'S' -> BombEdgeworkUtils.getSerialDigitSum(bomb) > 10;
			case 'T' -> bomb.hasIndicator("MSA");
			case 'U' -> bomb.getBatteryHolders() == 1;
			case 'V' -> bomb.serialHasVowel();
			case 'W' -> bomb.getIndicators().isEmpty();
			case 'X' -> bomb.getIndicators().size() == 1;
			case 'Y' -> BombEdgeworkUtils.getTotalPortCount(bomb) > 5;
			case 'Z' -> BombEdgeworkUtils.getTotalPortCount(bomb) < 2;
			default -> throw new IllegalArgumentException("Invalid statement letter: " + letter);
		};
	}

	private static boolean apply(LogicConnective op, boolean a, boolean b) {
		return switch (op) {
			case AND -> a && b;
			case OR -> a || b;
			case XOR -> a != b;
			case NAND -> !(a && b);
			case NOR -> !(a || b);
			case XNOR -> a == b;
			case IMPL_LEFT -> !a || b;   // false only when a true and b false
			case IMPL_RIGHT -> a || !b;  // false only when a false and b true
		};
	}
}
