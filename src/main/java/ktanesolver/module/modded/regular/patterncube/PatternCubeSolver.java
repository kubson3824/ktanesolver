package ktanesolver.module.modded.regular.patterncube;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

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
	type = ModuleType.PATTERN_CUBE,
	id = "PatternCubeModule",
	name = "Pattern Cube",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Fold the displayed net and place the five selected symbols in the correct orientation.",
	tags = {"cube", "net", "symbols", "orientation"}
)
public class PatternCubeSolver extends AbstractModuleSolver<PatternCubeInput, PatternCubeOutput> {
	private static final Pattern CELL = Pattern.compile("^[A-E][1-5]$");
	private static final String SYMBOLS = "ABCDEFGHXYZ";
	private static final String GROUP_1 =
		"X1,A3,B1;Y0,X1,A1;B0,D1,C2;Z1,A2,X0;Y2,B0,A2;Y3,C1,B0;" +
		"X2,C0,A1;X1,Y2,B0;C2,A3,D1;Z1,X3,B1;A2,C3,Y2;D1,B2,Y0;" +
		"X2,C2,B1;X1,A2,D2;X2,C3,Y0;D3,A0,B3;X0,Z2,C1;A0,Y3,D0;" +
		"D0,B0,X0;X1,C1,D0;Y0,D0,X3;C3,B3,A1;Z1,D0,X0;C1,D0,Y2";
	private static final String GROUP_2 =
		"X1,E0,F0;X0,E3,Y1;H1,G1,F1;Y3,Z3,E1;Z3,F1,E2;G1,Z1,F1;" +
		"E0,X2,G1;X0,F0,Y2;G1,E2,H3;F1,Y2,Z0;G2,E2,Z1;F1,Z1,H2;" +
		"G1,X1,F0;H3,X2,E2;Y1,X3,G3;H1,E3,F0;G0,Z2,Y0;Z0,H2,E3;" +
		"X3,H1,F0;G1,H3,X0;X3,H3,Y0;E0,F0,G1;Z3,Y3,H1;Z2,H3,G2";
	private static final Vec[] NORMAL = {
		new Vec(0, 1, 0), new Vec(0, 0, 1), new Vec(1, 0, 0),
		new Vec(0, 0, -1), new Vec(-1, 0, 0), new Vec(0, -1, 0)
	};
	private static final Vec[] UP = {
		new Vec(0, 0, -1), new Vec(0, 1, 0), new Vec(0, 1, 0),
		new Vec(0, 1, 0), new Vec(0, 1, 0), new Vec(0, 0, -1)
	};
	private static final Vec[] RIGHT = {
		new Vec(1, 0, 0), new Vec(1, 0, 0), new Vec(0, 0, -1),
		new Vec(-1, 0, 0), new Vec(0, 0, 1), new Vec(-1, 0, 0)
	};

	@Override
	protected SolveResult<PatternCubeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PatternCubeInput input
	) {
		String invalid = validate(input);
		if (invalid != null) return failure(invalid);

		HalfCube group1 = half(GROUP_1, input.group1());
		HalfCube group2 = half(GROUP_2, input.group2());
		Set<Character> used = new HashSet<>();
		used.addAll(group1.symbols()); used.addAll(group2.symbols());
		if (used.size() != 6) return failure("Those two reference cubes do not contain the module's six distinct symbols");

		char givenSymbol = symbol(input.givenSymbol());
		char highlightedSymbol = symbol(input.highlightedSymbol());
		Set<Character> selected = new HashSet<>();
		for (PatternCubeSymbolInput selection : input.selections()) selected.add(symbol(selection.symbol()));
		Set<Character> expected = new HashSet<>(used); expected.remove(givenSymbol);
		if (!used.contains(givenSymbol) || !used.contains(highlightedSymbol) || !selected.equals(expected)) {
			return failure("The given and selectable symbols must match the six symbols in the chosen reference cubes");
		}
		if (!selected.contains(highlightedSymbol)) return failure("The highlighted symbol must be one of the five selectable symbols");

		Set<Coord> cells = new HashSet<>();
		for (String cell : input.netCells()) cells.add(coord(cell));
		Coord givenCell = coord(input.givenCell());
		Coord highlightedCell = coord(input.highlightedCell());
		List<List<PatternCubePlacement>> answers = new ArrayList<>();
		for (int swap = 0; swap < 2; swap++) {
			HalfCube front = swap == 0 ? group1 : group2;
			HalfCube back = swap == 0 ? group2 : group1;
			for (int alignment = 0; alignment < 3; alignment++) {
				FaceSymbol[] cube = cube(front, back, alignment);
				int givenFace = faceOf(cube, givenSymbol);
				Map<Coord, FaceInfo> folded = fold(cells, givenCell, givenFace,
					mod(input.givenOrientation() - cube[givenFace].orientation()));
				if (folded == null || folded.get(highlightedCell).face() != faceOf(cube, highlightedSymbol)) continue;
				answers.add(placements(input, cube, folded));
			}
		}
		if (answers.isEmpty()) return failure("The highlighted square is inconsistent with the reference cubes, net, and given symbol");
		List<PatternCubePlacement> answer = answers.getFirst();
		if (answers.stream().anyMatch(candidate -> !candidate.equals(answer))) {
			return failure("These observations leave more than one cube orientation; check the highlighted square and symbol");
		}
		storeState(module, "highlightedSymbol", String.valueOf(highlightedSymbol));
		return success(new PatternCubeOutput(answer));
	}

	private static String validate(PatternCubeInput input) {
		if (input == null || input.group1() == null || input.group2() == null || input.netCells() == null
			|| input.cellLetters() == null || input.givenOrientation() == null || input.selections() == null) {
			return "Enter both reference cubes, all net cells, and all five selectable symbols";
		}
		if (input.group1() < 1 || input.group1() > 24 || input.group2() < 1 || input.group2() > 24) return "Reference cube numbers must be from 1 through 24";
		if (input.netCells().size() != 6 || input.netCells().stream().map(PatternCubeSolver::text).anyMatch(cell -> !CELL.matcher(cell).matches())
			|| new HashSet<>(input.netCells().stream().map(PatternCubeSolver::text).toList()).size() != 6) return "Enter six distinct net cells from A1 through E5";
		if (!input.netCells().stream().map(PatternCubeSolver::text).toList().contains(text(input.givenCell()))
			|| !input.netCells().stream().map(PatternCubeSolver::text).toList().contains(text(input.highlightedCell()))
			|| text(input.givenCell()).equals(text(input.highlightedCell()))) return "The given and highlighted cells must be different cells in the net";
		if (input.givenOrientation() < 0 || input.givenOrientation() > 3 || input.selections().size() != 5) return "Orientations must be N, E, S, or W and exactly five symbols must be entered";
		Set<String> letters = new HashSet<>();
		for (String cell : input.netCells()) {
			String letter = input.cellLetters().get(text(cell));
			if (letter == null || !letter.trim().toUpperCase(Locale.ROOT).matches("[A-TV-Z]") || !letters.add(letter.trim().toUpperCase(Locale.ROOT)))
				return "Enter the six distinct Twitch letters shown in the net (A–T or V–Z)";
		}
		for (PatternCubeSymbolInput selection : input.selections()) {
			if (selection == null || selection.orientation() == null || selection.orientation() < 0 || selection.orientation() > 3
				|| selection.symbol() == null || selection.symbol().length() != 1 || SYMBOLS.indexOf(symbol(selection.symbol())) < 0) return "Each selectable symbol needs a valid symbol and orientation";
		}
		return input.givenSymbol() == null || input.givenSymbol().length() != 1 || SYMBOLS.indexOf(symbol(input.givenSymbol())) < 0
			|| input.highlightedSymbol() == null || input.highlightedSymbol().length() != 1 || SYMBOLS.indexOf(symbol(input.highlightedSymbol())) < 0
			? "Choose valid given and highlighted symbols" : null;
	}

	private static List<PatternCubePlacement> placements(PatternCubeInput input, FaceSymbol[] cube, Map<Coord, FaceInfo> folded) {
		Map<Integer, Coord> cellByFace = new HashMap<>();
		folded.forEach((cell, info) -> cellByFace.put(info.face(), cell));
		List<PatternCubePlacement> result = new ArrayList<>();
		for (int i = 0; i < input.selections().size(); i++) {
			PatternCubeSymbolInput selection = input.selections().get(i);
			char symbol = symbol(selection.symbol());
			int face = faceOf(cube, symbol);
			Coord target = cellByFace.get(face);
			int targetOrientation = mod(cube[face].orientation() + folded.get(target).orientation());
			int turns = mod(targetOrientation - selection.orientation());
			String rotation = switch (turns) { case 1 -> "cw"; case 2 -> "180"; case 3 -> "ccw"; default -> "none"; };
			String cell = target.toString();
			String letter = input.cellLetters().get(cell).trim().toUpperCase(Locale.ROOT);
			result.add(new PatternCubePlacement(i + 1, String.valueOf(symbol), cell, letter,
				selection.orientation(), targetOrientation, rotation));
		}
		return List.copyOf(result);
	}

	private static Map<Coord, FaceInfo> fold(Set<Coord> cells, Coord root, int rootFace, int rootOrientation) {
		Map<Coord, FaceInfo> result = new LinkedHashMap<>();
		ArrayDeque<Coord> queue = new ArrayDeque<>();
		result.put(root, new FaceInfo(rootFace, rootOrientation)); queue.add(root);
		int[] dc = {0, 1, 0, -1}, dr = {-1, 0, 1, 0};
		while (!queue.isEmpty()) {
			Coord cell = queue.remove(); FaceInfo current = result.get(cell);
			for (int screenDirection = 0; screenDirection < 4; screenDirection++) {
				Coord next = new Coord(cell.col() + dc[screenDirection], cell.row() + dr[screenDirection]);
				if (!cells.contains(next)) continue;
				int canonicalDirection = mod(screenDirection - current.orientation());
				Vec nextNormal = tangent(current.face(), canonicalDirection);
				int nextFace = faceForNormal(nextNormal);
				int backCanonicalDirection = direction(nextFace, NORMAL[current.face()]);
				FaceInfo nextInfo = new FaceInfo(nextFace, mod(screenDirection + 2 - backCanonicalDirection));
				if (result.containsKey(next) && !result.get(next).equals(nextInfo)) return null;
				if (!result.containsKey(next)) { result.put(next, nextInfo); queue.add(next); }
			}
		}
		return result.size() == 6 && result.values().stream().map(FaceInfo::face).distinct().count() == 6 ? result : null;
	}

	private static FaceSymbol[] cube(HalfCube front, HalfCube back, int alignment) {
		FaceSymbol right, rear, bottom;
		if (alignment == 0) {
			rear = rotate(back.front(), 3); right = rotate(back.top(), 3); bottom = rotate(back.left(), 3);
		} else if (alignment == 1) {
			rear = back.top(); right = rotate(back.left(), 1); bottom = back.front();
		} else {
			rear = rotate(back.left(), 2); right = rotate(back.front(), 2); bottom = rotate(back.top(), 1);
		}
		return new FaceSymbol[] {front.top(), front.front(), right, rear, front.left(), bottom};
	}

	private static HalfCube half(String data, int index) {
		String[] values = data.split(";")[index - 1].split(",");
		return new HalfCube(parse(values[0]), parse(values[1]), parse(values[2]));
	}
	private static FaceSymbol parse(String value) { return new FaceSymbol(value.charAt(0), value.charAt(1) - '0'); }
	private static FaceSymbol rotate(FaceSymbol symbol, int by) { return new FaceSymbol(symbol.symbol(), mod(symbol.orientation() + by)); }
	private static int faceOf(FaceSymbol[] cube, char symbol) { for (int i = 0; i < cube.length; i++) if (cube[i].symbol() == symbol) return i; return -1; }
	private static Vec tangent(int face, int direction) { return switch (direction) { case 0 -> UP[face]; case 1 -> RIGHT[face]; case 2 -> UP[face].negative(); default -> RIGHT[face].negative(); }; }
	private static int direction(int face, Vec vector) { for (int i = 0; i < 4; i++) if (tangent(face, i).equals(vector)) return i; return -1; }
	private static int faceForNormal(Vec normal) { for (int i = 0; i < NORMAL.length; i++) if (NORMAL[i].equals(normal)) return i; return -1; }
	private static int mod(int value) { return Math.floorMod(value, 4); }
	private static String text(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }
	private static char symbol(String value) { return text(value).isEmpty() ? '\0' : text(value).charAt(0); }
	private static Coord coord(String value) { String cell = text(value); return new Coord(cell.charAt(0) - 'A', cell.charAt(1) - '0'); }

	record FaceSymbol(char symbol, int orientation) {}
	record HalfCube(FaceSymbol top, FaceSymbol left, FaceSymbol front) { List<Character> symbols() { return List.of(top.symbol(), left.symbol(), front.symbol()); } }
	record FaceInfo(int face, int orientation) {}
	record Vec(int x, int y, int z) { Vec negative() { return new Vec(-x, -y, -z); } }
	record Coord(int col, int row) { @Override public String toString() { return "" + (char) ('A' + col) + row; } }
}
