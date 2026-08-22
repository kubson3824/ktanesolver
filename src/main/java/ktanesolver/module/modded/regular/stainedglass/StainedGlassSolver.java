package ktanesolver.module.modded.regular.stainedglass;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.stainedglass.StainedGlassInput.Color;

@Service
@ModuleInfo(type = ModuleType.STAINED_GLASS, id = "stainedGlass", name = "Stained Glass",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Evaluate the fixed rule in each pane of the diamond-shaped stained-glass window.",
	tags = {"colors", "grid", "adjacency", "logic"})
public class StainedGlassSolver extends AbstractModuleSolver<StainedGlassInput, StainedGlassOutput> {
	private static final List<Coordinate> COORDINATES = coordinates();
	private static final Map<Coordinate, Integer> INDEX = index();

	@Override protected SolveResult<StainedGlassOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, StainedGlassInput input) {
		if (input == null || input.paneColors() == null || input.paneColors().size() != 25 || input.paneColors().stream().anyMatch(java.util.Objects::isNull))
			return failure("Enter all 25 pane colors in diamond-row order");
		List<String> smash = new ArrayList<>();
		for (int i = 0; i < 25; i++) if (matches(i, input.paneColors())) smash.add(position(i));
		String command = smash.isEmpty() ? "" : "press " + String.join(" ", smash);
		return success(new StainedGlassOutput(List.copyOf(smash), command));
	}

	private static boolean matches(int rule, List<Color> colors) {
		Color self = colors.get(rule);
		List<Color> adjacent = colors(adjacent(COORDINATES.get(rule)), colors);
		List<Color> above = colors(above(COORDINATES.get(rule)), colors);
		List<Color> below = colors(below(COORDINATES.get(rule)), colors);
		return switch (rule) {
			case 0, 18 -> is(self, Color.MALACHITE, Color.AMBER);
			case 1 -> colors.get(INDEX.get(right(COORDINATES.get(rule)))) == Color.ICE;
			case 2 -> row(COORDINATES.get(rule).sum() + 1, colors).contains(Color.AUREOLIN);
			case 3 -> is(self, Color.ICE, Color.AMETHYST);
			case 4 -> row(COORDINATES.get(rule).sum() - 1, colors).contains(Color.AMETHYST);
			case 5 -> above.stream().anyMatch(color -> is(color, Color.MALACHITE, Color.AMBER));
			case 6 -> is(self, Color.ICE, Color.ROSE);
			case 7 -> row(COORDINATES.get(rule).sum() - 1, colors).contains(Color.AMBER);
			case 8 -> is(self, Color.AMETHYST, Color.AUREOLIN);
			case 9 -> below.contains(Color.AMETHYST);
			case 10 -> is(self, Color.ROSE, Color.AUREOLIN);
			case 11 -> row(COORDINATES.get(rule).sum() + 1, colors).contains(Color.MALACHITE);
			case 12 -> adjacent.contains(self);
			case 13 -> adjacent.stream().noneMatch(self::equals);
			case 14 -> !above.isEmpty() && !below.isEmpty() && java.util.stream.Stream.concat(above.stream(), below.stream()).allMatch(color -> is(color, Color.MALACHITE, Color.AMETHYST));
			case 15 -> row(COORDINATES.get(rule).sum() + 1, colors).contains(Color.ROSE);
			case 16 -> is(self, Color.ICE, Color.AUREOLIN);
			case 17 -> new HashSet<>(adjacent).size() < adjacent.size();
			case 19 -> adjacent.contains(Color.ICE);
			case 20 -> adjacent.contains(Color.AUREOLIN);
			case 21 -> is(self, Color.AMETHYST, Color.ROSE);
			case 22 -> above.contains(Color.AMBER);
			case 23 -> colors.get(INDEX.get(left(COORDINATES.get(rule)))) == Color.ROSE;
			case 24 -> is(self, Color.ICE, Color.MALACHITE);
			default -> false;
		};
	}

	private static boolean is(Color color, Color first, Color second) { return color == first || color == second; }
	private static String position(int index) {
		int row = COORDINATES.get(index).sum() + 1;
		int firstR = Math.min(4, row - 1);
		return "" + row + (firstR - COORDINATES.get(index).r() + 1);
	}
	private static List<Color> colors(List<Coordinate> coordinates, List<Color> colors) { return coordinates.stream().map(INDEX::get).filter(java.util.Objects::nonNull).map(colors::get).toList(); }
	private static List<Color> row(int sum, List<Color> colors) { return colors(COORDINATES.stream().filter(coordinate -> coordinate.sum() == sum).toList(), colors); }
	private static List<Coordinate> adjacent(Coordinate p) { return List.of(new Coordinate(p.r()-1,p.c()), new Coordinate(p.r()+1,p.c()), new Coordinate(p.r(),p.c()-1), new Coordinate(p.r(),p.c()+1)); }
	private static List<Coordinate> above(Coordinate p) { return List.of(new Coordinate(p.r()-1,p.c()), new Coordinate(p.r(),p.c()-1)); }
	private static List<Coordinate> below(Coordinate p) { return List.of(new Coordinate(p.r()+1,p.c()), new Coordinate(p.r(),p.c()+1)); }
	private static Coordinate right(Coordinate p) { return new Coordinate(p.r()-1,p.c()+1); }
	private static Coordinate left(Coordinate p) { return new Coordinate(p.r()+1,p.c()-1); }

	private static List<Coordinate> coordinates() {
		List<Coordinate> result = new ArrayList<>();
		for (int sum = 0; sum <= 8; sum++) for (int r = Math.min(4, sum); r >= Math.max(0, sum - 4); r--) result.add(new Coordinate(r, sum-r));
		return List.copyOf(result);
	}
	private static Map<Coordinate, Integer> index() { Map<Coordinate, Integer> result = new HashMap<>(); for (int i=0;i<COORDINATES.size();i++) result.put(COORDINATES.get(i),i); return Map.copyOf(result); }
	private record Coordinate(int r, int c) { int sum() { return r+c; } }
}
