package ktanesolver.module.modded.regular.friendship;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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
	type = ModuleType.FRIENDSHIP,
	id = "friendship",
	name = "Friendship",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the displayed Element of Harmony from six friendship symbols",
	tags = {"symbols", "grid", "friendship", "modded"}
)
public class FriendshipSolver extends AbstractModuleSolver<FriendshipInput, FriendshipOutput> {
	private static final String[][] GRID = {
		{"J","G","U","K","V","8","L","C","H","4","W","P","M","R"},
		{"7","S","8","U","N","J","9","Y","F","P","Q","C","R","4"},
		{"Q","R","H","4","F","7","J","E","8","T","N","9","A","X"},
		{"D","3","S","H","U","E","T","P","V","J","L","A","4","7"},
		{"A","F","3","T","M","P","R","W","S","X","U","N","G","B"},
		{"V","K","G","P","Q","D","U","L","3","H","M","R","E","C"},
		{"4","9","T","F","B","X","D","U","Y","3","R","L","H","M"},
		{"G","4","9","J","8","3","X","K","A","Y","S","W","7","D"},
		{"K","T","F","B","J","Q","3","S","E","C","P","U","W","L"},
		{"S","M","A","C","7","H","E","B","G","F","V","X","L","N"},
		{"8","7","V","L","9","R","K","D","T","Q","B","Y","X","A"},
		{"W","8","4","Q","G","Y","V","T","7","N","3","B","C","P"},
		{"M","A","W","9","H","K","Y","J","N","D","X","E","8","F"},
		{"Y","N","B","G","W","S","M","Q","K","9","C","V","D","E"}
	};
	private static final String[] ELEMENTS = {
		"Altruism", "Amicability", "Authenticity", "Benevolence", "Caring", "Charitableness", "Compassion",
		"Conscientiousness", "Consideration", "Courage", "Fairness", "Flexibility", "Generosity", "Helpfulness",
		"Honesty", "Inspiration", "Kindness", "Laughter", "Loyalty", "Open-mindedness", "Patience", "Resoluteness",
		"Selflessness", "Sincerity", "Solidarity", "Support", "Sympathy", "Thoughtfulness"
	};
	private static final String CODES = "ABCDEFGHJKLMNPQRSTUVWXY34789";
	private static final Map<String, Integer> COLUMNS = indexed(
		new String[]{"Amethyst Star","Apple Cinnamon","Apple Fritter","Babs Seed","Berryshine","Big McIntosh","Bulk Biceps","Cadance","Golden Harvest","Celestia","Cheerilee","Cheese Sandwich","Cherry Jubilee","Coco Pommel"},
		new String[]{"Starlight Glimmer","Spoiled Rich","Silverstar","Silver Spoon","Silver Shill","Shining Armor","Screwball","Rose","Octavia Melody","Nurse Redheart","Night Light","Ms. Harshwhinny","Moon Dancer","Mayor Mare"}
	);
	private static final Map<String, Integer> ROWS = indexed(
		new String[]{"Coloratura","Daisy","Daring Do","Derpy","Diamond Tiara","Double Diamond","Filthy Rich","Granny Smith","Hoity Toity","Lightning Dust","Lily","Luna","Lyra","Maud Pie"},
		new String[]{"Vinyl Scratch","Twist","Twilight Velvet","Trouble Shoes","Trixie","Trenderhoof","Tree Hugger","Toe Tapper","Time Turner","Thunderlane","Sweetie Drops","Suri Polomare","Sunset Shimmer","Sunburst"}
	);

	@Override
	protected SolveResult<FriendshipOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, FriendshipInput input) {
		if (input.symbols() == null || input.symbols().size() != 6) return failure("Enter exactly six friendship symbols");
		if (input.displayedElements() == null || input.displayedElements().size() != 7) return failure("Enter exactly seven displayed Elements of Harmony");
		if (input.symbols().stream().anyMatch(s -> s == null || s.name() == null || s.x() < 1 || s.x() > 13 || s.y() < 1 || s.y() > 9)) {
			return failure("Every symbol needs a valid name and a position from columns 1-13 and rows 1-9");
		}
		if (input.symbols().stream().map(s -> s.name().trim().toLowerCase(Locale.ROOT)).distinct().count() != 6) return failure("Friendship symbols must be unique");
		if (input.symbols().stream().map(s -> s.x() + ":" + s.y()).distinct().count() != 6) return failure("Symbol positions must be unique");

		List<Located> columns = locate(input.symbols(), COLUMNS);
		List<Located> rows = locate(input.symbols(), ROWS);
		if (columns.size() != 3 || rows.size() != 3) return failure("Enter three column symbols and three row symbols from the manual");
		Located ignoredColumn = columns.stream().filter(s -> uniqueX(s, input.symbols())).min(Comparator.comparingInt(s -> s.symbol().x())).orElse(null);
		Located ignoredRow = rows.stream().filter(s -> uniqueY(s, input.symbols())).min(Comparator.comparingInt(s -> s.symbol().y())).orElse(null);
		if (ignoredColumn == null || ignoredRow == null) return failure("The positions do not contain a column and row symbol that can be disregarded");

		List<String> possible = new ArrayList<>();
		for (Located row : rows) if (row != ignoredRow) {
			for (Located column : columns) if (column != ignoredColumn) possible.add(element(GRID[row.index()][column.index()]));
		}
		List<String> matches = input.displayedElements().stream().filter(e -> e != null && possible.stream().anyMatch(p -> p.equalsIgnoreCase(e.trim()))).toList();
		if (matches.size() != 1) return failure("Exactly one displayed element must match the four possible intersections");
		module.getState().put("symbols", input.symbols());
		module.getState().put("displayedElements", input.displayedElements());
		return success(new FriendshipOutput(matches.get(0).trim(), possible));
	}

	private static List<Located> locate(List<FriendshipSymbol> symbols, Map<String, Integer> table) {
		return symbols.stream().filter(s -> table.containsKey(s.name().trim().toLowerCase(Locale.ROOT)))
			.map(s -> new Located(s, table.get(s.name().trim().toLowerCase(Locale.ROOT)))).toList();
	}

	private static boolean uniqueX(Located symbol, List<FriendshipSymbol> all) { return all.stream().filter(s -> s.x() == symbol.symbol().x()).count() == 1; }
	private static boolean uniqueY(Located symbol, List<FriendshipSymbol> all) { return all.stream().filter(s -> s.y() == symbol.symbol().y()).count() == 1; }
	private static String element(String code) { return ELEMENTS[CODES.indexOf(code)]; }

	private static Map<String, Integer> indexed(String[]... groups) {
		Map<String, Integer> result = new HashMap<>();
		for (String[] group : groups) for (int i = 0; i < group.length; i++) result.put(group[i].toLowerCase(Locale.ROOT), i);
		return result;
	}

	private record Located(FriendshipSymbol symbol, int index) {}
}
