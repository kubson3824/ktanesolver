package ktanesolver.module.modded.regular.monsplodefight;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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

@Service
@ModuleInfo(
	name = "Monsplode, Fight!",
	type = ModuleType.MONSPLODE_FIGHT,
	id = "monsplode-fight",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Choose the displayed move that deals the best net damage.",
	tags = {"combat", "edgework", "4-buttons"}
)
public class MonsplodeFightSolver extends AbstractModuleSolver<MonsplodeFightInput, MonsplodeFightOutput> {

	private enum Type { NORMAL, POISON, ROCK, GHOST, FIRE, WATER, GRASS, ELECTR, DARK }
	private record Opponent(String name, Type type) {}
	private record Move(String name, Type type, int damage) {}

	private static final List<Opponent> OPPONENTS = List.of(
		new Opponent("Buhar", Type.WATER), new Opponent("Lanaluff", Type.NORMAL),
		new Opponent("Bob", Type.NORMAL), new Opponent("Mountoise", Type.ROCK),
		new Opponent("Nibs", Type.NORMAL), new Opponent("Aluga", Type.NORMAL),
		new Opponent("Lugirit", Type.GHOST), new Opponent("Caadarim", Type.NORMAL),
		new Opponent("Vellarim", Type.WATER), new Opponent("Flaurim", Type.FIRE),
		new Opponent("Gloorim", Type.DARK), new Opponent("Melbor", Type.DARK),
		new Opponent("Clondar", Type.ELECTR), new Opponent("Docsplode", Type.NORMAL),
		new Opponent("Magmy", Type.FIRE), new Opponent("Pouse", Type.ELECTR),
		new Opponent("Ukkens", Type.POISON), new Opponent("Asteran", Type.GRASS),
		new Opponent("Violan", Type.GRASS), new Opponent("Zenlad", Type.GRASS),
		new Opponent("Zapra", Type.ELECTR), new Opponent("Myrchat", Type.POISON),
		new Opponent("Percy", Type.WATER), new Opponent("Cutie Pie", Type.NORMAL)
	);

	private static final List<Move> MOVES = List.of(
		new Move("Appearify", Type.NORMAL, 4), new Move("Battery Power", Type.ELECTR, 0),
		new Move("Bedrock", Type.ROCK, 0), new Move("Boo", Type.GHOST, 0),
		new Move("Boom", Type.FIRE, 0), new Move("Bug Spray", Type.POISON, 2),
		new Move("Countdown", Type.POISON, 0), new Move("Dark Portal", Type.DARK, 0),
		new Move("Fiery Soul", Type.FIRE, 0), new Move("Finale", Type.GRASS, 2),
		new Move("Freak Out", Type.GHOST, 1), new Move("Glyph", Type.NORMAL, 0),
		new Move("Last Word", Type.GHOST, 0), new Move("Sendify", Type.NORMAL, 2),
		new Move("Shock", Type.ELECTR, 3), new Move("Shrink", Type.NORMAL, 0),
		new Move("Sidestep", Type.NORMAL, 0), new Move("Stretch", Type.NORMAL, 0),
		new Move("Void", Type.DARK, 2), new Move("Defuse", Type.NORMAL, 0),
		new Move("Candle", Type.FIRE, 2), new Move("Cave In", Type.ROCK, 3),
		new Move("Double Zap", Type.ELECTR, 4), new Move("Earthquake", Type.ROCK, 5),
		new Move("Flame Spear", Type.FIRE, 6), new Move("Fountain", Type.WATER, 6),
		new Move("Grass Blade", Type.GRASS, 4), new Move("Heavy Rain", Type.WATER, 4),
		new Move("High Voltage", Type.ELECTR, 6), new Move("Hollow Gaze", Type.DARK, 4),
		new Move("Ivy Spikes", Type.GRASS, 6), new Move("Spectre", Type.GHOST, 5),
		new Move("Splash", Type.WATER, 0), new Move("Tac", Type.NORMAL, 5),
		new Move("Tangle", Type.GRASS, 2), new Move("Tic", Type.NORMAL, 3),
		new Move("Toe", Type.NORMAL, 1), new Move("Torchlight", Type.FIRE, 4),
		new Move("Toxic Waste", Type.POISON, 5), new Move("Venom Fang", Type.POISON, 3),
		new Move("Zap", Type.ELECTR, 2)
	);

	private static final Map<String, Opponent> OPPONENT_BY_NAME = indexOpponents();
	private static final Map<String, Move> MOVE_BY_NAME = indexMoves();
	private static final double[][] MULTIPLIERS = {
		{1, 1, .5, 0, 1, 1, 1, 1, 1}, {1, .5, .5, .5, 1, 1, 2, 1, 1},
		{1, 1, 1, 1, 2, 1, 1, 1, 1}, {0, 1, 1, 2, 1, 1, 1, 1, .5},
		{1, 1, .5, 1, .5, .5, 2, 1, 1}, {1, 1, 2, 1, 2, .5, .5, 1, 1},
		{1, .5, 2, 1, .5, 2, .5, 1, 1}, {1, 1, 1, 1, 1, 2, .5, .5, 1},
		{1, 1, 1, 2, 1, 1, 1, 1, .5}
	};

	@Override
	protected SolveResult<MonsplodeFightOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MonsplodeFightInput input) {
		if(input == null || input.opponent() == null || input.moves() == null || input.moves().size() != 4) {
			return failure("Choose an opponent and exactly four moves");
		}

		Opponent opponent = OPPONENT_BY_NAME.get(key(input.opponent()));
		if(opponent == null) return failure("Unknown Monsplode: " + input.opponent());

		List<Move> moves = input.moves().stream().map(name -> MOVE_BY_NAME.get(key(name))).toList();
		if(moves.stream().anyMatch(move -> move == null)) return failure("Every move must be recognized");
		if(Set.copyOf(moves).size() != 4) return failure("The four moves must be different");
		if(moves.stream().anyMatch(move -> move.name().equals("Countdown")) && (input.minutesRemaining() == null || input.minutesRemaining() < 0)) {
			return failure("Enter the whole minutes remaining for Countdown");
		}

		storeState(module, "input", input);
		Move forced = moves.stream().filter(move -> move.name().equals("Defuse")).findFirst().orElse(null);
		if(forced == null && opponent.name().equals("Docsplode")) forced = namedMove(moves, "Boom");
		if(forced == null && opponent.name().equals("Percy")) forced = namedMove(moves, "Splash");
		if(forced != null) return success(new MonsplodeFightOutput(forced.name(), 0));

		Move best = null;
		double bestDamage = opponent.name().equals("Cutie Pie") ? Double.POSITIVE_INFINITY : Double.NEGATIVE_INFINITY;
		for(int i = 0; i < moves.size(); i++) {
			Move move = moves.get(i);
			if(move.name().equals("Boom")) continue;
			double damage = netDamage(opponent, move, i, moves, bomb, module, input.minutesRemaining());
			boolean better = opponent.name().equals("Cutie Pie") ? damage < bestDamage : damage > bestDamage;
			if(best == null || better) {
				best = move;
				bestDamage = damage;
			}
		}

		return best == null ? failure("Boom cannot be used against this Monsplode") : success(new MonsplodeFightOutput(best.name(), bestDamage));
	}

	private static double netDamage(Opponent opponent, Move move, int index, List<Move> moves, BombEntity bomb, ModuleEntity module, Integer minutesRemaining) {
		Type opponentType = opponentType(opponent, bomb);
		int damage = baseDamage(opponent, move, index, moves, bomb, module, minutesRemaining);
		double net = damage * MULTIPLIERS[move.type().ordinal()][opponentType.ordinal()];

		if(opponent.name().equals("Buhar") && move.type() == Type.ROCK || opponent.name().equals("Nibs") && move.type() == Type.GRASS ||
			opponent.name().equals("Ukkens") && move.type() == Type.WATER || opponent.name().equals("Bob") && bomb.isIndicatorLit("BOB") && move.type() != Type.NORMAL ||
			opponent.name().equals("Caadarim") && portCount(bomb) > 0 && move.type() == Type.NORMAL ||
			opponent.name().equals("Vellarim") && bomb.hasPort(PortType.PARALLEL) && move.type() == Type.NORMAL ||
			opponent.name().equals("Flaurim") && bomb.hasPort(PortType.SERIAL) && move.type() == Type.NORMAL ||
			opponent.name().equals("Gloorim") && bomb.hasPort(PortType.DVI) && move.type() == Type.NORMAL) return 0;

		if(opponent.name().equals("Lanaluff") && move.type() == Type.POISON && sharesSerialLetter(opponent.name(), bomb)) net += 3;
		if(opponent.name().equals("Aluga")) net += move.type() == Type.FIRE ? 2 : move.type() == Type.WATER ? -1 : 0;
		if(opponent.name().equals("Lugirit")) net += move.type() == Type.WATER ? 2 : move.type() == Type.FIRE ? -1 : 0;
		if(opponent.name().equals("Clondar") && move.type() == Type.WATER || opponent.name().equals("Zenlad") && move.type() == Type.ELECTR) net += 3;
		if(opponent.name().equals("Melbor") && (net == 6 || net == 8) || opponent.name().equals("Pouse") && net >= 6) return 0;
		return net;
	}

	private static int baseDamage(Opponent opponent, Move move, int index, List<Move> moves, BombEntity bomb, ModuleEntity module, Integer minutesRemaining) {
		return switch(move.name()) {
			case "Appearify" -> opponentType(opponent, bomb) == Type.DARK ? 10 : 4;
			case "Battery Power" -> bomb.getBatteryCount() * 2;
			case "Bedrock" -> bomb.getModules().size();
			case "Boo" -> (int)bomb.getSerialNumber().toUpperCase(Locale.ROOT).chars().filter(c -> c == '0' || c == 'O').count() * 3;
			case "Bug Spray" -> opponent.name().equals("Melbor") || opponent.name().equals("Zenlad") ? 10 : 2;
			case "Countdown" -> minutesRemaining;
			case "Dark Portal" -> portCount(bomb);
			case "Fiery Soul" -> bomb.getBatteryCount() * bomb.getBatteryHolders();
			case "Finale" -> otherModules(bomb, module).stream().allMatch(ModuleEntity::isSolved) ? 10 : 2;
			case "Freak Out" -> bomb.isIndicatorLit("FRK") || bomb.isIndicatorLit("FRQ") ? 10 : bomb.hasIndicator("FRK") || bomb.hasIndicator("FRQ") ? 5 : 1;
			case "Glyph" -> letterCount(opponent.name());
			case "Last Word" -> bomb.getLastDigit();
			case "Sendify" -> opponentType(opponent, bomb) == Type.ROCK || opponentType(opponent, bomb) == Type.GRASS ? 10 : 2;
			case "Shock" -> bomb.hasPort(PortType.RJ45) ? 8 : 3;
			case "Shrink" -> serialDigits(bomb).min().orElse(0);
			case "Sidestep" -> letterCount(moves.get(index % 2 == 0 ? index + 1 : index - 1).name());
			case "Stretch" -> serialDigits(bomb).max().orElse(0);
			case "Void" -> otherModules(bomb, module).stream().noneMatch(ModuleEntity::isSolved) ? 10 : 2;
			default -> move.damage();
		};
	}

	private static Type opponentType(Opponent opponent, BombEntity bomb) {
		return switch(opponent.name()) {
			case "Mountoise" -> bomb.getStrikes() > 0 ? Type.NORMAL : opponent.type();
			case "Magmy" -> bomb.getBatteryCount() < 3 ? Type.ROCK : opponent.type();
			case "Asteran" -> bomb.hasIndicator("CAR") ? Type.WATER : opponent.type();
			case "Violan" -> bomb.hasIndicator("CLR") ? Type.WATER : opponent.type();
			case "Zapra" -> bomb.getBatteryCount() < 3 ? Type.NORMAL : opponent.type();
			case "Myrchat" -> bomb.getIndicators().values().stream().noneMatch(Boolean.TRUE::equals) ? Type.DARK : opponent.type();
			default -> opponent.type();
		};
	}

	private static java.util.stream.IntStream serialDigits(BombEntity bomb) {
		return bomb.getSerialNumber().chars().filter(Character::isDigit).map(c -> c - '0');
	}

	private static List<ModuleEntity> otherModules(BombEntity bomb, ModuleEntity module) {
		return bomb.getModules().stream().filter(other -> other != module).toList();
	}

	private static int portCount(BombEntity bomb) {
		return bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
	}

	private static boolean sharesSerialLetter(String name, BombEntity bomb) {
		String serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		return name.toUpperCase(Locale.ROOT).chars().filter(Character::isLetter).anyMatch(c -> serial.indexOf(c) >= 0);
	}

	private static int letterCount(String value) {
		return (int)value.chars().filter(Character::isLetter).count();
	}

	private static Move namedMove(List<Move> moves, String name) {
		return moves.stream().filter(move -> move.name().equals(name)).findFirst().orElse(null);
	}

	private static String key(String value) {
		return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
	}

	private static Map<String, Opponent> indexOpponents() {
		Map<String, Opponent> result = new HashMap<>();
		OPPONENTS.forEach(opponent -> result.put(key(opponent.name()), opponent));
		return Map.copyOf(result);
	}

	private static Map<String, Move> indexMoves() {
		Map<String, Move> result = new HashMap<>();
		MOVES.forEach(move -> result.put(key(move.name()), move));
		return Map.copyOf(result);
	}
}
