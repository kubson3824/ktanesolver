package ktanesolver.module.modded.regular.x01;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.X01,
	id = "X01",
	name = "X01",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Check out the required score on a ten-section dartboard",
	tags = {"darts", "numbers", "edgework", "modded"}
)
public class X01Solver extends AbstractModuleSolver<X01Input, X01Output> {
	private static final int[][] TARGETS = {
		{74, 53, 79},
		{62, 41, 70},
		{42, 47, 86},
		{38, 66, 51},
		{80, 67, 58}
	};

	@Override
	protected SolveResult<X01Output> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, X01Input input
	) {
		List<Integer> values = input.segmentValues();
		if (values == null || values.size() != 10
			|| values.stream().anyMatch(value -> value == null || value < 1 || value > 20)
			|| values.stream().distinct().count() != 10) {
			return failure("Enter 10 distinct segment values from 1 to 20, clockwise from north");
		}

		int target = targetScore(bomb, values);
		String restrictions = restrictions(bomb, values, target);
		int dartCount = switch (restrictions) {
			case "CG", "AF", "GH", "BEI" -> 3;
			case "" -> 2;
			default -> 4;
		};
		List<String> darts = checkout(values, target, dartCount, restrictions);
		if (darts == null) return failure("No legal checkout found; check the segment values");
		return success(new X01Output(target, dartCount, restrictions, darts));
	}

	private static int targetScore(BombEntity bomb, List<Integer> values) {
		String serial = Objects.toString(bomb.getSerialNumber(), "");
		int aaAndDigits = bomb.getAaBatteryCount() + (int)serial.chars().filter(Character::isDigit).count();
		int indicatorsAndPorts = bomb.getIndicators().size() + bomb.getPortPlates().stream()
			.filter(Objects::nonNull)
			.mapToInt(plate -> plate.getPorts() == null ? 0 : plate.getPorts().size())
			.sum();
		int row = aaAndDigits <= 2 ? 0 : aaAndDigits <= 4 ? 1 : aaAndDigits == 5 ? 2 : aaAndDigits <= 7 ? 3 : 4;
		int column = indicatorsAndPorts <= 2 ? 0 : indicatorsAndPorts <= 5 ? 1 : 2;
		int redBlack = 0;
		int greenTan = 0;
		for (int index = 0; index < values.size(); index++) {
			if (index % 2 == 0) redBlack += values.get(index);
			else greenTan += values.get(index);
		}
		return redBlack == greenTan ? 69 : TARGETS[row][column] + (redBlack > greenTan ? 10 : -8);
	}

	private static String restrictions(BombEntity bomb, List<Integer> values, int target) {
		if (hasRun(values, 3, value -> value <= 6)) return "CG";
		if (hasRun(values, 3, value -> value >= 15)) return "DH";
		if (hasRun(values, 4, value -> value % 2 == 1)) return "AF";
		if (hasRun(values, 3, value -> value % 2 == 0)) return "BD";
		String serial = Objects.toString(bomb.getSerialNumber(), "").toUpperCase();
		if (serial.indexOf('M') >= 0 || serial.indexOf('V') >= 0 || serial.indexOf('G') >= 0) return "CEI";
		if (values.stream().filter(value -> value > 10).count() == 5) return "GH";
		return target <= 45 ? "" : "BEI";
	}

	private static boolean hasRun(List<Integer> values, int length, java.util.function.IntPredicate predicate) {
		for (int start = 0; start < values.size(); start++) {
			boolean matches = true;
			for (int offset = 0; offset < length; offset++) {
				matches &= predicate.test(values.get((start + offset) % values.size()));
			}
			if (matches) return true;
		}
		return false;
	}

	private static List<String> checkout(
		List<Integer> values, int target, int dartCount, String restrictions
	) {
		List<Dart> darts = new ArrayList<>();
		for (int index = 0; index < values.size(); index++) {
			int value = values.get(index);
			if (!restrictions.contains("A") || value % 2 == 0) {
				darts.add(new Dart("OUT" + value, value, Kind.SINGLE, index));
				darts.add(new Dart("IN" + value, value, Kind.SINGLE, index));
			}
			darts.add(new Dart("D" + value, value * 2, Kind.DOUBLE, index));
			darts.add(new Dart("T" + value, value * 3, Kind.TREBLE, index));
		}
		darts.add(new Dart("SB", 25, Kind.SINGLE, -1));
		darts.add(new Dart("DB", 50, Kind.DOUBLE, -1));

		for (Dart last : darts) {
			if (last.kind != Kind.DOUBLE || !validClosingDouble(last, restrictions)) continue;
			List<Dart> chosen = new ArrayList<>();
			if (choose(darts, last, 0, dartCount - 1, target - last.score, chosen, restrictions)) {
				chosen.add(last);
				return chosen.stream().map(Dart::token).toList();
			}
		}
		return null;
	}

	private static boolean choose(
		List<Dart> darts, Dart last, int start, int remainingDarts, int remainingScore,
		List<Dart> chosen, String restrictions
	) {
		if (remainingDarts == 0) {
			if (remainingScore != 0) return false;
			List<Dart> checkout = new ArrayList<>(chosen);
			checkout.add(last);
			return validRestrictions(checkout, restrictions);
		}
		if (remainingScore <= 0) return false;
		for (int index = start; index < darts.size(); index++) {
			Dart dart = darts.get(index);
			if (dart == last || dart.score > remainingScore) continue;
			chosen.add(dart);
			if (choose(darts, last, index + 1, remainingDarts - 1, remainingScore - dart.score, chosen, restrictions)) {
				return true;
			}
			chosen.remove(chosen.size() - 1);
		}
		return false;
	}

	private static boolean validClosingDouble(Dart dart, String restrictions) {
		if (restrictions.contains("B") && !(dart.index >= 0 && (dart.index <= 2 || dart.index >= 8))) return false;
		return !restrictions.contains("D") || dart.index >= 0 && dart.index % 2 == 1;
	}

	private static boolean validRestrictions(List<Dart> darts, String restrictions) {
		if (restrictions.contains("C")
			&& darts.stream().noneMatch(dart -> dart.kind == Kind.DOUBLE && dart.index >= 3 && dart.index <= 7)) {
			return false;
		}
		if (restrictions.contains("E") && darts.stream().filter(dart -> dart.token.equals("SB")).count() != 1) {
			return false;
		}
		if (restrictions.contains("F") && darts.stream().noneMatch(dart -> dart.kind == Kind.TREBLE)) return false;
		if (restrictions.contains("G")
			&& (darts.stream().noneMatch(dart -> dart.kind == Kind.SINGLE)
				|| darts.stream().noneMatch(dart -> dart.kind == Kind.DOUBLE)
				|| darts.stream().noneMatch(dart -> dart.kind == Kind.TREBLE))) {
			return false;
		}
		if (restrictions.contains("H")
			&& darts.stream().noneMatch(dart -> dart.kind == Kind.TREBLE && dart.score / 3 % 2 == 0)) {
			return false;
		}
		return !restrictions.contains("I") || darts.stream().map(Dart::score).distinct().count() == darts.size();
	}

	private enum Kind { SINGLE, DOUBLE, TREBLE }

	private record Dart(String token, int score, Kind kind, int index) {}
}
