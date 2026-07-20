package ktanesolver.module.modded.regular.gameoflife;

import java.util.Arrays;
import java.util.List;

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
import ktanesolver.module.modded.regular.gameoflife.GameOfLifeInput.Cell;
import ktanesolver.module.modded.regular.gameoflife.GameOfLifeInput.Color;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.GAME_OF_LIFE_CRUEL,
	id = "game-of-life-cruel",
	name = "Game of Life Cruel",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Convert a colored 6×8 grid, then apply one generation of Conway's Game of Life",
	tags = {"grid", "colors", "cellular automaton", "edgework", "Souvenir", "modded"}
)
public class GameOfLifeCruelSolver extends AbstractModuleSolver<GameOfLifeInput, GameOfLifeOutput> {
	@Override
	protected SolveResult<GameOfLifeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, GameOfLifeInput input
	) {
		String error = input == null ? "Enter all 48 cells" : GameOfLifeRules.validate(input.cells());
		if (error != null) return failure(error);
		if (input.cells().stream().anyMatch(cell -> (cell.first() == Color.WHITE) != (cell.second() == Color.WHITE))) {
			return failure("White cells cannot flash with another color");
		}

		storeState(module, "colorCombinations", input.cells().stream()
			.filter(cell -> cell.first() != Color.WHITE && cell.second() != Color.WHITE)
			.filter(cell -> cell.first().ordinal() > 1 || cell.second().ordinal() > 1)
			.map(GameOfLifeCruelSolver::combinationName).distinct().toList());

		List<Boolean> initial = input.cells().stream().map(cell -> cell.first() == Color.WHITE).toList();
		if (bobHelps(bomb)) return success(new GameOfLifeOutput(initial, true));
		if (input.timerBelowHalf() == null) return failure("Specify whether the timer is below half its original time");

		boolean[] rules = colorRules(bomb, input.timerBelowHalf());
		List<Boolean> converted = input.cells().stream().map(cell -> convert(cell, rules, bomb.isLastDigitEven())).toList();
		return success(new GameOfLifeOutput(GameOfLifeRules.nextGeneration(converted), false));
	}

	private static boolean bobHelps(BombEntity bomb) {
		return bomb.getBatteryCount() == 6 && bomb.getBatteryHolders() == 3 && bomb.isIndicatorUnlit("BOB");
	}

	private static boolean[] colorRules(BombEntity bomb, boolean timerBelowHalf) {
		boolean[] rules = new boolean[Color.values().length];
		long lit = BombEdgeworkUtils.getLitIndicatorCount(bomb);
		long unlit = BombEdgeworkUtils.getUnlitIndicatorCount(bomb);
		rules[Color.RED.ordinal()] = bomb.getStrikes() > 0 && bomb.getBatteryCount() != 0;
		rules[Color.ORANGE.ordinal()] = timerBelowHalf && !bomb.hasIndicator("CAR");
		rules[Color.YELLOW.ordinal()] = lit > unlit && !bomb.hasPort(PortType.RJ45);
		rules[Color.GREEN.ordinal()] = BombEdgeworkUtils.countSolvedModules(bomb) % 2 == 0 && !bomb.hasIndicator("CLR");
		rules[Color.BLUE.ordinal()] = bomb.getSerialNumber().toUpperCase().chars().anyMatch(c -> "SEAKY".indexOf(c) >= 0)
			&& !bomb.hasIndicator("SND");
		rules[Color.PURPLE.ordinal()] = unlit > lit && bomb.getBatteryCount() < 4;
		rules[Color.BROWN.ordinal()] = BombEdgeworkUtils.getDistinctPortTypeCount(bomb) >= 3 && !bomb.getIndicators().isEmpty();
		return rules;
	}

	private static boolean convert(Cell cell, boolean[] rules, boolean lastDigitEven) {
		Color first = cell.first();
		Color second = cell.second();
		if (first == second) return first == Color.WHITE || first != Color.BLACK && rules[first.ordinal()];
		if (first == Color.BLACK || second == Color.BLACK) return !rules[(first == Color.BLACK ? second : first).ordinal()];
		if (first == Color.BROWN || second == Color.BROWN) {
			Color other = first == Color.BROWN ? second : first;
			return rules[(lastDigitEven ? Color.BROWN : other).ordinal()];
		}
		if (primary(first) && primary(second)) return rules[mix(first, second).ordinal()];
		if (primary(first) != primary(second)) {
			Color primary = primary(first) ? first : second;
			Color secondary = primary(first) ? second : first;
			return rules[(components(secondary).contains(primary) ? primary : secondary).ordinal()];
		}
		return rules[components(first).stream().filter(components(second)::contains).findFirst().orElseThrow().ordinal()];
	}

	private static boolean primary(Color color) {
		return color == Color.RED || color == Color.YELLOW || color == Color.BLUE;
	}

	private static Color mix(Color first, Color second) {
		List<Color> colors = List.of(first, second);
		if (colors.containsAll(List.of(Color.RED, Color.YELLOW))) return Color.ORANGE;
		if (colors.containsAll(List.of(Color.YELLOW, Color.BLUE))) return Color.GREEN;
		return Color.PURPLE;
	}

	private static List<Color> components(Color color) {
		return switch (color) {
			case ORANGE -> List.of(Color.RED, Color.YELLOW);
			case GREEN -> List.of(Color.YELLOW, Color.BLUE);
			case PURPLE -> List.of(Color.RED, Color.BLUE);
			default -> List.of();
		};
	}

	private static String combinationName(Cell cell) {
		Color[] colors = {cell.first(), cell.second()};
		Arrays.sort(colors);
		return colors[0] == colors[1] ? "Solid " + label(colors[0]) : label(colors[0]) + "/" + label(colors[1]);
	}

	private static String label(Color color) {
		String name = color.name().toLowerCase();
		return Character.toUpperCase(name.charAt(0)) + name.substring(1);
	}
}
