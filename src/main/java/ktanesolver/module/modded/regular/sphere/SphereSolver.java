package ktanesolver.module.modded.regular.sphere;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.sphere.SphereInput.Color;
import ktanesolver.module.modded.regular.sphere.SphereOutput.Action;

@Service
@ModuleInfo(type = ModuleType.THE_SPHERE, id = "sphere", name = "The Sphere",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate and order six timed taps and five timed holds from the color cycle and edgework.",
	tags = {"colors", "timer", "taps", "holds", "serial-number", "edgework"})
public class SphereSolver extends AbstractModuleSolver<SphereInput, SphereOutput> {
	private static final String[][] ORDERS = {
		{"T4","T1","H5","T2","H3","H1","T6","T3","H2","H4","T5"},
		{"H3","T2","T6","T1","H2","H5","T3","T4","T5","H1","H4"},
		{"H5","H1","T3","T4","H3","T6","T1","H2","H4","T5","T2"},
		{"T1","H2","T3","H5","T6","H4","H1","T2","T4","T5","H3"},
		{"H1","T5","T3","H4","H2","T6","T1","T2","T4","H3","H5"},
		{"T2","T4","H5","H1","T3","T1","H2","H3","H4","T5","T6"},
		{"T6","H3","T2","H1","T5","T4","H4","H2","T3","T1","H5"},
		{"H4","H1","H3","T2","T6","H5","H2","T4","T3","T5","T1"},
		{"T4","T6","H3","T1","T2","H5","H1","T3","H2","T5","H4"},
		{"H2","T2","H3","T6","H1","T5","T4","H4","H5","T1","T3"},
		{"T1","H1","T2","H2","T3","H3","T4","H4","T5","H5","T6"}
	};

	@Override protected SolveResult<SphereOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SphereInput input) {
		if (input == null || input.colors() == null || input.colors().size() != 5 || input.colors().stream().anyMatch(java.util.Objects::isNull)) return failure("Enter the five colors in cycle order");
		if (bomb.getSerialNumber() == null || !bomb.getSerialNumber().matches("[A-Z0-9]{6}")) return failure("The serial number must contain six letters or digits");
		if (input.correctResponses() != null && input.correctResponses().size() != 11) return failure("The retry mask must contain all 11 response positions");
		int[] taps = bomb.getSerialNumber().chars().map(value -> Character.isDigit(value) ? value - '0' : (value - 'A' + 1) % 10).toArray();
		List<Integer> holds = input.colors().stream().map(color -> holdTime(color, bomb, taps)).toList();
		int order = order(bomb);
		List<Action> full = new ArrayList<>(11);
		for (String token : ORDERS[order]) {
			boolean tap = token.charAt(0) == 'T'; int index = token.charAt(1) - '1';
			full.add(new Action(tap ? "tap" : "hold", tap ? taps[index] : holds.get(index)));
		}
		List<Action> actions = new ArrayList<>();
		for (int index = 0; index < 11; index++) if (input.correctResponses() == null || !Boolean.TRUE.equals(input.correctResponses().get(index))) actions.add(full.get(index));
		storeState(module, "sphereColors", input.colors().stream().map(color -> color.name().toLowerCase()).toList());
		return success(new SphereOutput(actions, full, order, holds));
	}

	static int holdTime(Color color, BombEntity bomb, int[] serial) {
		int batteries = bomb.getBatteryCount(), lit = lit(bomb), unlit = unlit(bomb), plates = bomb.getPortPlates().size(), holders = bomb.getBatteryHolders(), ports = totalPorts(bomb);
		return switch (color) {
			case RED -> square(portCount(bomb, PortType.DVI) + unlit) % 10 + 1;
			case BLUE -> digitOr(portCount(bomb, PortType.PARALLEL) + batteries + lit, 3, 10, 5);
			case GREEN -> rootOr(java.util.Arrays.stream(serial).sum(), 4);
			case ORANGE -> digitSum((holders + plates + 7) * (portCount(bomb, PortType.RJ45) + portCount(bomb, PortType.PARALLEL) + unlit + 3)) % 10 + 1;
			case PINK -> Math.abs(square(lit) - square(batteries)) % 10 + 1;
			case PURPLE -> digitOr(ports + plates + unlit + holders, 3, 100, 7);
			case GREY -> rootOr(square(plates) + batteries * batteries * batteries, 4);
			case WHITE -> digitalRoot((batteries + lit + 13) * (ports + lit + unlit + plates + 9));
		};
	}

	static int order(BombEntity bomb) {
		if (bomb.getAaBatteryCount() == 2 && portCount(bomb, PortType.SERIAL) == 1 && bomb.isIndicatorUnlit("FRQ") && bomb.getPortPlates().size() == 3) return 10;
		int first = lit(bomb) + bomb.getBatteryHolders() + portCount(bomb, PortType.SERIAL) + portCount(bomb, PortType.RJ45);
		int second = unlit(bomb) + bomb.getPortPlates().size() + bomb.getDBatteryCount() + portCount(bomb, PortType.STEREO_RCA);
		return first * second % 10;
	}

	private static int lit(BombEntity bomb) { return (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count(); }
	private static int unlit(BombEntity bomb) { return (int) bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count(); }
	private static int portCount(BombEntity bomb, PortType type) { return (int) bomb.getPortPlates().stream().map(PortPlateEntity::getPorts).filter(Set.class::isInstance).filter(ports -> ports.contains(type)).count(); }
	private static int totalPorts(BombEntity bomb) { return bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts() == null ? 0 : plate.getPorts().size()).sum(); }
	private static int square(int value) { return value * value; }
	private static int digitalRoot(int value) { return value == 0 ? 0 : (value - 1) % 9 + 1; }
	private static int rootOr(int value, int fallback) { int root = digitalRoot(value); return root == 0 ? fallback : root; }
	private static int digitOr(int base, int power, int divisor, int fallback) { int value = 1; for (int i = 0; i < power; i++) value *= base; int digit = value >= divisor ? value / divisor % 10 : 0; return digit == 0 ? fallback : digit; }
	private static int digitSum(int value) { int sum = 0; do { sum += value % 10; value /= 10; } while (value > 0); return sum; }
}
