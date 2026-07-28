package ktanesolver.module.modded.regular.thewire;

import java.util.List;
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
import ktanesolver.module.modded.regular.thewire.TheWireInput.WireColor;

@Service
@ModuleInfo(
	type = ModuleType.THE_WIRE,
	id = "wire",
	name = "The Wire",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Set three dials and determine the timer digit for cutting the wire.",
	tags = {"wire", "dials", "colors", "timer", "edgework"}
)
public class TheWireSolver extends AbstractModuleSolver<TheWireInput, TheWireOutput> {
	private static final Set<PortType> COUNTED_PORTS = Set.of(
		PortType.SERIAL, PortType.PARALLEL, PortType.RJ45, PortType.DVI
	);

	@Override
	protected SolveResult<TheWireOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheWireInput input
	) {
		if (input == null || input.dial1Color() == null || input.dial2Color() == null
			|| input.dial3Color() == null || input.wireColor() == null)
			return failure("All three dial colors and the wire color are required");
		if (input.displayedNumber() == null || input.displayedNumber() < 0 || input.displayedNumber() > 9)
			return failure("Displayed number must be from 0 to 9");
		if (input.initiationCount() == null || input.initiationCount() < 1)
			return failure("Initiation count must be at least 1");
		if (bomb.getSerialNumber() == null)
			return failure("Bomb serial number is required");

		List<WireColor> dials = List.of(input.dial1Color(), input.dial2Color(), input.dial3Color());
		String[] settings = dialSettings(bomb, input, dials);
		int cutSecond = cutSecond(bomb, input, dials);

		storeState(module, "dialColors", dials);
		storeState(module, "displayedNumber", input.displayedNumber());
		return success(new TheWireOutput(settings[0], settings[1], settings[2], cutSecond));
	}

	private static String[] dialSettings(BombEntity bomb, TheWireInput input, List<WireColor> dials) {
		String[] settings = new String[3];
		int displayed = input.displayedNumber();
		int serialSum = bomb.getSerialNumber().chars().filter(Character::isDigit).map(c -> c - '0').sum();
		int equivalent = serialSum + displayed;
		boolean equivalentInSerial = equivalent > 0
			&& bomb.getSerialNumber().toUpperCase().indexOf('A' + (equivalent - 1) % 26) >= 0;

		if (equivalentInSerial) {
			settings[0] = "Q";
			flowTwo(bomb, input, dials, settings);
		} else if (dials.contains(input.wireColor())) {
			flowTwo(bomb, input, dials, settings);
		} else if (portCount(bomb) > displayed) {
			flowFour(input, dials, settings);
		} else {
			flowSeven(input, dials, settings);
		}
		return settings;
	}

	private static void flowTwo(BombEntity bomb, TheWireInput input, List<WireColor> dials, String[] settings) {
		int colorLetters = input.dial2Color().name().length() + input.wireColor().name().length();
		if (input.displayedNumber() + bomb.getBatteryCount() > colorLetters) {
			boolean greenPresent = dials.contains(WireColor.GREEN) || input.wireColor() == WireColor.GREEN;
			boolean purplePresent = dials.contains(WireColor.PURPLE) || input.wireColor() == WireColor.PURPLE;
			if (greenPresent && purplePresent) {
				settings[2] = "Y";
				flowSeven(input, dials, settings);
				return;
			}
			settings[1] = "M";
			if (portCount(bomb) > input.displayedNumber()) flowFour(input, dials, settings);
			else flowSeven(input, dials, settings);
		} else {
			settings[1] = "E";
			flowFour(input, dials, settings);
		}
	}

	private static void flowFour(TheWireInput input, List<WireColor> dials, String[] settings) {
		if (Set.of(1, 2, 4, 6).contains(input.displayedNumber())) {
			boolean matchingDials = dials.stream().distinct().count() < 3;
			fillUnset(settings, matchingDials ? new String[]{"Q", "E", "Y"} : new String[]{"I", "M", "T"});
		} else {
			settings[2] = settings[2] == null ? "T" : settings[2];
			flowSeven(input, dials, settings);
		}
	}

	private static void flowSeven(TheWireInput input, List<WireColor> dials, String[] settings) {
		boolean redPresent = dials.contains(WireColor.RED) || input.wireColor() == WireColor.RED;
		fillUnset(settings, input.displayedNumber() == 3 || input.displayedNumber() == 7 || redPresent
			? new String[]{"Z", "A", "O"} : new String[]{"U", "S", "B"});
	}

	private static void fillUnset(String[] settings, String[] defaults) {
		for (int i = 0; i < settings.length; i++) if (settings[i] == null) settings[i] = defaults[i];
	}

	private static int cutSecond(BombEntity bomb, TheWireInput input, List<WireColor> dials) {
		int a = input.displayedNumber();
		int b = input.initiationCount();
		int c = bomb.getIndicators().size() * 2;
		int d = bomb.getPortPlates().size() * 4;
		int e = a % 3;
		int f = (int) bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		int g = specialPortCount(bomb);
		int h = bomb.getModules().size();
		int i = a * 6;
		int j = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		boolean one = Set.of(WireColor.BLUE, WireColor.GREEN, WireColor.RED).contains(dials.get(0));
		boolean two = Set.of(WireColor.ORANGE, WireColor.GREY, WireColor.BLUE).contains(dials.get(1));
		boolean three = Set.of(WireColor.PURPLE, WireColor.RED, WireColor.ORANGE).contains(dials.get(2));
		boolean wire = Set.of(WireColor.GREEN, WireColor.GREY, WireColor.PURPLE).contains(input.wireColor());
		int mask = (one ? 8 : 0) | (two ? 4 : 0) | (three ? 2 : 0) | (wire ? 1 : 0);

		return switch (mask) {
			case 14 -> (g + a) % 10;
			case 7 -> (j + e + f) % 10;
			case 1 -> ((i + d + h) % 7) + 2;
			case 12 -> (b + c) % 6;
			case 8 -> (j * a + c) % 9;
			case 5 -> firstDigit(f * i + h);
			case 10 -> (g * b + b) % (e + 4);
			case 11 -> d % 10;
			case 4 -> a * c * f % 8;
			case 15 -> firstDigit(3 * h + g);
			case 3 -> (i + d - e) % 10;
			case 6 -> 4 * j % 5;
			case 13 -> ((d % 7) + (i % 4)) % 10;
			case 2 -> c * g % 10;
			case 9 -> j * (f + h) % 9;
			default -> b * (e + a) % 8;
		};
	}

	private static int firstDigit(int value) {
		while (value >= 10) value /= 10;
		return value;
	}

	private static int portCount(BombEntity bomb) {
		return bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
	}

	private static int specialPortCount(BombEntity bomb) {
		return bomb.getPortPlates().stream()
			.mapToInt(plate -> (int) plate.getPorts().stream().filter(COUNTED_PORTS::contains).count())
			.sum();
	}
}
