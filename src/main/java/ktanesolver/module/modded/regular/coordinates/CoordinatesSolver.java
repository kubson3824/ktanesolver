package ktanesolver.module.modded.regular.coordinates;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
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
	type = ModuleType.COORDINATES,
	id = "coordinates",
	name = "Coordinates",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the two clues that identify the same cell in a variable-size grid.",
	tags = { "coordinates", "grid", "notation", "modded" }
)
public class CoordinatesSolver extends AbstractModuleSolver<CoordinatesInput, CoordinatesOutput> {
	private static final Pattern OFFSET = Pattern.compile("(\\d+)\\s+(right|east|left|west|down|south|up|north)");

	@Override
	protected SolveResult<CoordinatesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, CoordinatesInput input
	) {
		if (input == null || input.clues() == null || input.clues().size() != 9) {
			return failure("Enter all 9 clues shown on the module");
		}
		if (input.clues().stream().anyMatch(clue -> clue == null || clue.isBlank())) {
			return failure("Clues cannot be blank");
		}

		GridSize size = null;
		int sizeIndex = -1;
		for (int i = 0; i < input.clues().size(); i++) {
			GridSize candidate = parseSize(input.clues().get(i));
			if (candidate == null) continue;
			if (size != null) return failure("More than one clue looks like a grid size");
			size = candidate;
			sizeIndex = i;
		}
		if (size == null) return failure("No valid grid-size clue was found");

		Map<Cell, List<String>> byCell = new LinkedHashMap<>();
		for (int i = 0; i < input.clues().size(); i++) {
			if (i == sizeIndex) continue;
			Cell cell = parseCell(input.clues().get(i), size.width(), size.height());
			if (cell == null) return failure("Clue " + (i + 1) + " is not a valid position on this grid");
			byCell.computeIfAbsent(cell, ignored -> new ArrayList<>()).add(input.clues().get(i).trim());
		}

		List<List<String>> duplicates = byCell.values().stream().filter(clues -> clues.size() == 2).toList();
		if (duplicates.size() != 1 || byCell.values().stream().anyMatch(clues -> clues.size() > 2)) {
			return failure("The clues must contain exactly one duplicated grid position");
		}

		storeState(module, "input", input);
		storeState(module, "gridSizeClue", size.clue());
		return success(new CoordinatesOutput(size.width(), size.height(), List.copyOf(duplicates.getFirst())));
	}

	static GridSize parseSize(String raw) {
		String clue = normalize(raw);
		Matcher match = match("^(\\d+)$|^\\((\\d+)\\)$", clue);
		if (match != null) {
			boolean swapped = match.group(2) != null;
			int total = Integer.parseInt(swapped ? match.group(2) : match.group(1));
			int smaller = total == 9 ? 3 : total == 15 || total == 21 ? 3 : total == 25 || total == 35 ? 5 : total == 49 ? 7 : 0;
			if (smaller == 0) return null;
			int larger = total / smaller;
			return new GridSize(swapped ? smaller : larger, swapped ? larger : smaller, (swapped ? "(" : "") + total + (swapped ? ")" : ""));
		}
		match = match("^(\\d+)\\s*[x×]\\s*(\\d+)$", clue);
		if (match != null) return size(number(match, 1), number(match, 2), number(match, 1) + "×" + number(match, 2));
		match = match("^(\\d+)\\s+by\\s+(\\d+)$", clue);
		if (match != null) return size(number(match, 2), number(match, 1), number(match, 1) + " by " + number(match, 2));
		match = match("^(\\d+)\\s*\\*\\s*(\\d+)$", clue);
		if (match != null && number(match, 2) != 0 && number(match, 1) % number(match, 2) == 0) {
			return size(number(match, 1) / number(match, 2), number(match, 2), number(match, 1) + "*" + number(match, 2));
		}
		match = match("^(\\d+)\\s*:\\s*(\\d+)$", clue);
		if (match != null && number(match, 2) != 0 && number(match, 1) % number(match, 2) == 0) {
			return size(number(match, 2), number(match, 1) / number(match, 2), number(match, 1) + " : " + number(match, 2));
		}
		return null;
	}

	static Cell parseCell(String raw, int width, int height) {
		String clue = normalize(raw).replace('“', '"').replace('”', '"');
		Matcher match = match("^\\[(\\d+),\\s*(\\d+)]$", clue);
		if (match != null) return cell(number(match, 1), number(match, 2), width, height);
		match = match("^([a-z])(\\d+)$", clue);
		if (match != null) return cell(match.group(1).charAt(0) - 'a', number(match, 2) - 1, width, height);
		match = match("^<(\\d+),\\s*(\\d+)>$", clue);
		if (match != null) return cell(number(match, 2), number(match, 1), width, height);
		match = match("^(\\d+),\\s*(\\d+)$", clue);
		if (match != null) return cell(number(match, 2) - 1, number(match, 1) - 1, width, height);
		match = match("^\\((\\d+),\\s*(\\d+)\\)$", clue);
		if (match != null) return cell(number(match, 1), height - 1 - number(match, 2), width, height);
		match = match("^([a-z])-(\\d+)$", clue);
		if (match != null) return cell(match.group(1).charAt(0) - 'a', height - number(match, 2), width, height);
		match = match("^\"(\\d+),\\s*(\\d+)\"$", clue);
		if (match != null) return cell(number(match, 2), height - 1 - number(match, 1), width, height);
		match = match("^(\\d+)/(\\d+)$", clue);
		if (match != null) return cell(number(match, 2) - 1, height - number(match, 1), width, height);
		match = match("^\\[(\\d+)]$", clue);
		if (match != null) return scanline(number(match, 1), width, height);
		match = match("^(\\d+)(?:st|nd|rd|th)$", clue);
		if (match != null) return scanline(number(match, 1) - 1, width, height);
		match = match("^#(\\d+)$", clue);
		if (match != null) {
			int index = number(match, 1) - 1;
			return index < 0 ? null : cell(index % width, height - 1 - index / width, width, height);
		}
		match = match("^chinese\\s+(\\d+)$", clue);
		if (match != null) return chinese(number(match, 1), width, height);
		if (clue.matches("[一二三四五六七八九十]+")) return chinese(chineseNumber(clue), width, height);
		return relative(clue, width, height);
	}

	private static Cell relative(String clue, int width, int height) {
		String normalized = clue.replace('’', '\'').replace("-", " ");
		int from = normalized.lastIndexOf(" from ");
		String offsets = from < 0 ? "" : normalized.substring(0, from);
		String anchor = from < 0 ? normalized : normalized.substring(from + 6);
		Cell start = switch (anchor) {
			case "12 o'clock" -> width % 2 == 1 ? new Cell(width / 2, 0) : null;
			case "9 o'clock" -> height % 2 == 1 ? new Cell(0, height / 2) : null;
			case "3 o'clock" -> height % 2 == 1 ? new Cell(width - 1, height / 2) : null;
			case "6 o'clock" -> width % 2 == 1 ? new Cell(width / 2, height - 1) : null;
			case "north west corner", "top left" -> new Cell(0, 0);
			case "north center", "top middle" -> width % 2 == 1 ? new Cell(width / 2, 0) : null;
			case "north east corner", "top right" -> new Cell(width - 1, 0);
			case "west center", "middle left" -> height % 2 == 1 ? new Cell(0, height / 2) : null;
			case "center", "middle center" -> width % 2 == 1 && height % 2 == 1 ? new Cell(width / 2, height / 2) : null;
			case "east center", "middle right" -> height % 2 == 1 ? new Cell(width - 1, height / 2) : null;
			case "south west corner", "bottom left" -> new Cell(0, height - 1);
			case "south center", "bottom middle" -> width % 2 == 1 ? new Cell(width / 2, height - 1) : null;
			case "south east corner", "bottom right" -> new Cell(width - 1, height - 1);
			default -> null;
		};
		if (start == null || !OFFSET.matcher(offsets).replaceAll("").replace(",", "").isBlank()) return null;
		int col = start.col();
		int row = start.row();
		Matcher match = OFFSET.matcher(offsets);
		while (match.find()) {
			int amount = Integer.parseInt(match.group(1));
			switch (match.group(2)) {
				case "right", "east" -> col += amount;
				case "left", "west" -> col -= amount;
				case "down", "south" -> row += amount;
				case "up", "north" -> row -= amount;
			}
		}
		return cell(col, row, width, height);
	}

	private static Cell scanline(int index, int width, int height) {
		return index < 0 ? null : cell(index % width, index / width, width, height);
	}

	private static Cell chinese(int number, int width, int height) {
		int index = number - 1;
		return index < 0 ? null : cell(width - 1 - index / height, index % height, width, height);
	}

	private static int chineseNumber(String value) {
		String digits = "一二三四五六七八九";
		int ten = value.indexOf('十');
		if (ten < 0) return value.length() == 1 ? digits.indexOf(value.charAt(0)) + 1 : -1;
		if (ten != value.lastIndexOf('十') || ten > 1 || value.length() - ten > 2) return -1;
		int tens = ten == 0 ? 1 : digits.indexOf(value.charAt(0)) + 1;
		int ones = ten == value.length() - 1 ? 0 : digits.indexOf(value.charAt(ten + 1)) + 1;
		return tens * 10 + ones;
	}

	private static GridSize size(int width, int height, String clue) {
		return width >= 3 && width <= 7 && height >= 3 && height <= 7 ? new GridSize(width, height, clue) : null;
	}

	private static Cell cell(int col, int row, int width, int height) {
		return col >= 0 && col < width && row >= 0 && row < height ? new Cell(col, row) : null;
	}

	private static Matcher match(String regex, String value) {
		Matcher matcher = Pattern.compile(regex).matcher(value);
		return matcher.matches() ? matcher : null;
	}

	private static int number(Matcher matcher, int group) {
		return Integer.parseInt(matcher.group(group));
	}

	private static String normalize(String value) {
		return value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
	}

	record GridSize(int width, int height, String clue) {}
	record Cell(int col, int row) {}
}
