package ktanesolver.module.modded.regular.mortalkombat;

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
import ktanesolver.module.modded.regular.mortalkombat.MortalKombatOutput.Move;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.MORTAL_KOMBAT,
	id = "mortalKombat",
	name = "Mortal Kombat",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine three attacks and a fatality from the two fighters and bomb edgework",
	tags = {"gamepad", "characters", "edgework", "modded"}
)
public class MortalKombatSolver extends AbstractModuleSolver<MortalKombatInput, MortalKombatOutput> {
	private static final Set<Integer> PRIMES = Set.of(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31);
	private static final Map<String, Fighter> FIGHTERS = Map.ofEntries(
		fighter("JOHNNY CAGE", List.of("KANO", "LIU KANG", "RAIDEN", "SCORPION", "SONYA BLADE", "SUB-ZERO"),
			List.of(move("Green Fireball", "⇦⇨A"), move("Shadow Kick", "⇦⇨B"), move("Nut Cracker", "⇩⇩C")),
			List.of("021", "102", "210", "201", "012", "120"),
			List.of(move("Deadly Uppercut", "⇩⇩⇦C⇧B"), move("Torso Rip", "⇦⇦⇦BB⇧"), move("Stage", "⇩⇦⇧⇩AB"))),
		fighter("KANO", List.of("JOHNNY CAGE", "LIU KANG", "RAIDEN", "SCORPION", "SONYA BLADE", "SUB-ZERO"),
			List.of(move("Kanoball", "⇧⇩C"), move("Knife Throw", "⇨⇨B"), move("Chokehold", "⇩⇦A")),
			List.of("120", "102", "012", "210", "201", "021"),
			List.of(move("Heart Rip", "A⇩B⇧⇦C"), move("Eye Laser", "⇧⇧⇨⇨CB"), move("Stage", "ABC⇦⇦⇧"))),
		fighter("LIU KANG", List.of("JOHNNY CAGE", "KANO", "RAIDEN", "SCORPION", "SONYA BLADE", "SUB-ZERO"),
			List.of(move("Dragon Fire", "⇨⇨C"), move("Flying Dragon Kick", "⇨⇧A"), move("Air Throw", "⇦⇩B")),
			List.of("201", "012", "120", "021", "102", "210"),
			List.of(move("Butterfly Flip", "⇩⇨B⇦B⇩"), move("Dragon's Bite", "⇨⇨⇩A⇧C"), move("Stage", "⇨⇨⇦⇦⇧A"))),
		fighter("RAIDEN", List.of("JOHNNY CAGE", "KANO", "LIU KANG", "SCORPION", "SONYA BLADE", "SUB-ZERO"),
			List.of(move("Lightning Bolt", "⇦⇦B"), move("Torpedo", "⇩⇨A"), move("Teleport", "⇩⇧C")),
			List.of("210", "201", "021", "120", "102", "012"),
			List.of(move("Electric Decapitation", "AA⇦⇧⇨B"), move("Explosive Uppercut", "⇩⇧⇩⇧BB"), move("Stage", "C⇧⇦AB⇩"))),
		fighter("SCORPION", List.of("JOHNNY CAGE", "KANO", "LIU KANG", "RAIDEN", "SONYA BLADE", "SUB-ZERO"),
			List.of(move("Spear", "⇦⇦A"), move("Teleport Punch", "⇦⇨C"), move("Air Throw", "⇧⇧B")),
			List.of("012", "120", "102", "210", "201", "021"),
			List.of(move("Toasty!", "⇨⇨⇨BBB"), move("Spear Slice", "⇧⇧⇩⇦AC"), move("Stage", "A⇨B⇩C⇩"))),
		fighter("SONYA BLADE", List.of("JOHNNY CAGE", "KANO", "LIU KANG", "RAIDEN", "SCORPION", "SUB-ZERO"),
			List.of(move("Energy Rings", "⇧⇨A"), move("Leg Grab", "⇩⇦C"), move("Square Wave Punch", "⇨⇦B")),
			List.of("210", "201", "021", "012", "120", "102"),
			List.of(move("Fire Kiss", "⇨⇦⇦⇨CB"), move("Crush Kiss", "⇩⇧⇨B⇦A"), move("Stage", "⇧⇧⇩⇦AC"))),
		fighter("SUB-ZERO", List.of("JOHNNY CAGE", "KANO", "LIU KANG", "RAIDEN", "SCORPION", "SONYA BLADE"),
			List.of(move("Ice Freeze", "⇨⇧B"), move("Slide", "⇨⇨A"), move("Ground Freeze", "⇨⇩C")),
			List.of("021", "102", "210", "012", "120", "201"),
			List.of(move("Spine Rip", "⇦⇧⇨⇩CC"), move("Ice Shatter", "⇨⇩⇦⇧AA"), move("Stage", "⇧⇨A⇦⇧B")))
	);

	@Override
	protected SolveResult<MortalKombatOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MortalKombatInput input
	) {
		if (input == null) return failure("Select both fighters");
		String player = normalize(input.player());
		String opponent = normalize(input.opponent());
		Fighter fighter = FIGHTERS.get(player);
		if (fighter == null || !fighter.opponents().contains(opponent)) return failure("Select two different valid fighters");

		int opponentIndex = fighter.opponents().indexOf(opponent);
		List<Move> attacks = fighter.orders().get(opponentIndex).chars()
			.mapToObj(index -> fighter.attacks().get(index - '0'))
			.toList();
		Move fatality = fighter.fatalities().get(fatalityIndex(player, opponentIndex < 3, bomb));
		storeState(module, "input", new MortalKombatInput(player, opponent));
		return success(new MortalKombatOutput(attacks, fatality));
	}

	private static int fatalityIndex(String player, boolean firstGroup, BombEntity bomb) {
		int batteries = bomb.getBatteryCount();
		int indicators = bomb.getIndicators().size();
		int ports = BombEdgeworkUtils.getTotalPortCount(bomb);
		return switch (player) {
			case "JOHNNY CAGE" -> firstGroup
				? first(bomb.hasPort(PortType.PARALLEL) || bomb.hasPort(PortType.SERIAL), bomb.isLastDigitOdd())
				: first(hasAnyIndicator(bomb, true, "CAR", "CLR", "MSA") || hasAnyIndicator(bomb, false, "BOB", "NSA", "FRK"), batteries % 2 == 0);
			case "KANO" -> firstGroup
				? first(bomb.getDBatteryCount() > bomb.getAaBatteryCount(), BombEdgeworkUtils.getUnlitIndicatorCount(bomb) == 0)
				: first(bomb.serialHasVowel(), bomb.hasPort(PortType.DVI) || bomb.hasPort(PortType.RJ45));
			case "LIU KANG" -> firstGroup
				? first(BombEdgeworkUtils.getLitIndicatorCount(bomb) > 0, bomb.hasPort(PortType.STEREO_RCA) || bomb.hasPort(PortType.PS2))
				: first(PRIMES.contains(BombEdgeworkUtils.getSerialDigitSum(bomb)), bomb.getDBatteryCount() == 0);
			case "RAIDEN" -> firstGroup
				? first(batteries <= 4, "LPT".chars().anyMatch(character -> BombEdgeworkUtils.serialContains(bomb, (char) character)))
				: first(indicators == 0, BombEdgeworkUtils.countPortPlatesWithPortType(bomb, PortType.SERIAL) > 1);
			case "SCORPION" -> firstGroup
				? first(ports > 3, bomb.getAaBatteryCount() > bomb.getDBatteryCount())
				: first(bomb.isLastDigitEven(), hasAnyIndicator(bomb, true, "BOB", "FRK") || hasAnyIndicator(bomb, false, "FRQ", "CAR"));
			case "SONYA BLADE" -> firstGroup
				? first(indicators > ports, BombEdgeworkUtils.getFirstSerialDigit(bomb) > batteries)
				: first(batteries > BombEdgeworkUtils.getFirstSerialDigit(bomb), ports > indicators);
			case "SUB-ZERO" -> firstGroup
				? first(BombEdgeworkUtils.getSerialDigitSum(bomb) % 3 == 0, batteries == 0)
				: first(BombEdgeworkUtils.getLitIndicatorCount(bomb) == 0, bomb.hasPort(PortType.PARALLEL) || bomb.hasPort(PortType.STEREO_RCA));
			default -> 2;
		};
	}

	private static int first(boolean first, boolean second) {
		return first ? 0 : second ? 1 : 2;
	}

	private static boolean hasAnyIndicator(BombEntity bomb, boolean lit, String... labels) {
		return List.of(labels).stream().anyMatch(label -> lit ? bomb.isIndicatorLit(label) : bomb.isIndicatorUnlit(label));
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}

	private static Move move(String name, String controls) {
		return new Move(name, controls);
	}

	private static Map.Entry<String, Fighter> fighter(
		String name, List<String> opponents, List<Move> attacks, List<String> orders, List<Move> fatalities
	) {
		return Map.entry(name, new Fighter(opponents, attacks, orders, fatalities));
	}

	private record Fighter(List<String> opponents, List<Move> attacks, List<String> orders, List<Move> fatalities) {
	}
}
