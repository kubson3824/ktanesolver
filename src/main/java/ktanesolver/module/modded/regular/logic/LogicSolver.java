
package ktanesolver.module.modded.regular.logic;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
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
			case 'B' -> serialHasMoreLettersThanDigits(bomb);
			case 'C' -> bomb.hasIndicator("IND");
			case 'D' -> bomb.hasIndicator("FRK");
			case 'E' -> getUnlitIndicatorCount(bomb) == 1;
			case 'F' -> getDistinctPortTypeCount(bomb) > 1;
			case 'G' -> bomb.getBatteryCount() >= 2;
			case 'H' -> bomb.getBatteryCount() < 2;
			case 'I' -> bomb.isLastDigitOdd();
			case 'J' -> bomb.getBatteryCount() > 4;
			case 'K' -> getLitIndicatorCount(bomb) == 1;
			case 'L' -> bomb.getIndicators().size() > 2;
			case 'M' -> hasNoDuplicatePorts(bomb);
			case 'N' -> bomb.getBatteryHolders() > 2;
			case 'O' -> hasBothLitAndUnlit(bomb);
			case 'P' -> bomb.hasPort(PortType.PARALLEL);
			case 'Q' -> getTotalPortCount(bomb) == 2;
			case 'R' -> bomb.hasPort(PortType.PS2);
			case 'S' -> getSerialDigitSum(bomb) > 10;
			case 'T' -> bomb.hasIndicator("MSA");
			case 'U' -> bomb.getBatteryHolders() == 1;
			case 'V' -> bomb.serialHasVowel();
			case 'W' -> bomb.getIndicators().isEmpty();
			case 'X' -> bomb.getIndicators().size() == 1;
			case 'Y' -> getTotalPortCount(bomb) > 5;
			case 'Z' -> getTotalPortCount(bomb) < 2;
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

	private static int getTotalPortCount(BombEntity bomb) {
		return bomb.getPortPlates().stream()
			.mapToInt(p -> p.getPorts().size())
			.sum();
	}

	private static long getDistinctPortTypeCount(BombEntity bomb) {
		Set<PortType> distinct = bomb.getPortPlates().stream()
			.flatMap(p -> p.getPorts().stream())
			.collect(Collectors.toSet());
		return distinct.size();
	}

	private static boolean hasNoDuplicatePorts(BombEntity bomb) {
		List<PortType> all = bomb.getPortPlates().stream()
			.flatMap(p -> p.getPorts().stream())
			.toList();
		return all.size() == all.stream().distinct().count();
	}

	private static int getSerialDigitSum(BombEntity bomb) {
		String s = bomb.getSerialNumber();
		if (s == null) return 0;
		return s.chars()
			.filter(Character::isDigit)
			.map(c -> c - '0')
			.sum();
	}

	private static boolean serialHasMoreLettersThanDigits(BombEntity bomb) {
		String s = bomb.getSerialNumber();
		if (s == null) return false;
		long letters = s.chars().filter(Character::isLetter).count();
		long digits = s.chars().filter(Character::isDigit).count();
		return letters > digits;
	}

	private static long getLitIndicatorCount(BombEntity bomb) {
		return bomb.getIndicators().values().stream()
			.filter(Boolean::booleanValue)
			.count();
	}

	private static long getUnlitIndicatorCount(BombEntity bomb) {
		return bomb.getIndicators().values().stream()
			.filter(b -> !Boolean.TRUE.equals(b))
			.count();
	}

	private static boolean hasBothLitAndUnlit(BombEntity bomb) {
		boolean hasLit = bomb.getIndicators().values().stream().anyMatch(Boolean::booleanValue);
		boolean hasUnlit = bomb.getIndicators().values().stream().anyMatch(b -> !Boolean.TRUE.equals(b));
		return hasLit && hasUnlit;
	}
}
