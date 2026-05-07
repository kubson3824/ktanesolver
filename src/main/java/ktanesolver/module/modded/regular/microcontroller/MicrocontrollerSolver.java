package ktanesolver.module.modded.regular.microcontroller;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

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
	type = ModuleType.MICROCONTROLLER,
	id = "microcontroller",
	name = "Microcontroller",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Map the microcontroller's numbered pins to their required component color codes",
	tags = {"pins", "colors", "serial"}
)
public class MicrocontrollerSolver extends AbstractModuleSolver<MicrocontrollerInput, MicrocontrollerOutput> {

	private static final Map<MicrocontrollerType, Map<Integer, List<MicrocontrollerComponent>>> PIN_LAYOUTS = createPinLayouts();

	@Override
	protected SolveResult<MicrocontrollerOutput> doSolve(
		RoundEntity round,
		BombEntity bomb,
		ModuleEntity module,
		MicrocontrollerInput input
	) {
		if(input == null) {
			return failure("Microcontroller input is required");
		}
		if(input.controllerType() == null) {
			return failure("Select the controller type");
		}
		if(input.controllerSerialNumber() == null || input.controllerSerialNumber().isBlank()) {
			return failure("Enter the controller serial number");
		}

		List<MicrocontrollerComponent> layout = PIN_LAYOUTS
			.getOrDefault(input.controllerType(), Map.of())
			.get(input.pinCount());
		if(layout == null) {
			return failure("Pin count must be 6, 8, or 10 for the selected controller type");
		}

		ColorRule colorRule = determineColorRule(bomb, input.controllerSerialNumber().trim().toUpperCase());
		List<MicrocontrollerPinSolution> pins = IntStream.range(0, layout.size())
			.mapToObj(index -> new MicrocontrollerPinSolution(
				index + 1,
				layout.get(index),
				colorFor(layout.get(index), colorRule.colors())
			))
			.toList();

		return success(new MicrocontrollerOutput(pins, colorRule.description()));
	}

	private static ColorRule determineColorRule(BombEntity bomb, String controllerSerialNumber) {
		if(lastDigit(controllerSerialNumber) == 1 || lastDigit(controllerSerialNumber) == 4) {
			return new ColorRule(
				"controller serial last digit is 1 or 4",
				Map.of(
					MicrocontrollerComponent.VCC, MicrocontrollerColor.YELLOW,
					MicrocontrollerComponent.AIN, MicrocontrollerColor.MAGENTA,
					MicrocontrollerComponent.DIN, MicrocontrollerColor.GREEN,
					MicrocontrollerComponent.PWM, MicrocontrollerColor.BLUE,
					MicrocontrollerComponent.RST, MicrocontrollerColor.RED
				)
			);
		}
		if(hasLitSigIndicator(bomb) || bomb.hasPort(PortType.RJ45)) {
			return new ColorRule(
				"lit SIG indicator or RJ-45 port",
				Map.of(
					MicrocontrollerComponent.VCC, MicrocontrollerColor.YELLOW,
					MicrocontrollerComponent.AIN, MicrocontrollerColor.RED,
					MicrocontrollerComponent.DIN, MicrocontrollerColor.MAGENTA,
					MicrocontrollerComponent.PWM, MicrocontrollerColor.GREEN,
					MicrocontrollerComponent.RST, MicrocontrollerColor.BLUE
				)
			);
		}
		if(bombSerialContainsSpecialCharacter(bomb)) {
			return new ColorRule(
				"bomb serial contains C, L, R, X, 1, or 8",
				Map.of(
					MicrocontrollerComponent.VCC, MicrocontrollerColor.RED,
					MicrocontrollerComponent.AIN, MicrocontrollerColor.MAGENTA,
					MicrocontrollerComponent.DIN, MicrocontrollerColor.GREEN,
					MicrocontrollerComponent.PWM, MicrocontrollerColor.BLUE,
					MicrocontrollerComponent.RST, MicrocontrollerColor.YELLOW
				)
			);
		}
		Integer secondControllerDigit = nthDigit(controllerSerialNumber, 2);
		if(secondControllerDigit != null && secondControllerDigit == bomb.getBatteryCount()) {
			return new ColorRule(
				"controller serial second digit matches the battery count",
				Map.of(
					MicrocontrollerComponent.VCC, MicrocontrollerColor.RED,
					MicrocontrollerComponent.AIN, MicrocontrollerColor.BLUE,
					MicrocontrollerComponent.DIN, MicrocontrollerColor.YELLOW,
					MicrocontrollerComponent.PWM, MicrocontrollerColor.GREEN,
					MicrocontrollerComponent.RST, MicrocontrollerColor.MAGENTA
				)
			);
		}
		return new ColorRule(
			"default color row",
			Map.of(
				MicrocontrollerComponent.VCC, MicrocontrollerColor.GREEN,
				MicrocontrollerComponent.AIN, MicrocontrollerColor.RED,
				MicrocontrollerComponent.DIN, MicrocontrollerColor.YELLOW,
				MicrocontrollerComponent.PWM, MicrocontrollerColor.BLUE,
				MicrocontrollerComponent.RST, MicrocontrollerColor.MAGENTA
			)
		);
	}

	private static MicrocontrollerColor colorFor(
		MicrocontrollerComponent component,
		Map<MicrocontrollerComponent, MicrocontrollerColor> colors
	) {
		if(component == MicrocontrollerComponent.GND) {
			return MicrocontrollerColor.WHITE;
		}
		return colors.get(component);
	}

	private static boolean hasLitSigIndicator(BombEntity bomb) {
		return bomb.getIndicators().entrySet().stream()
			.anyMatch(entry -> "SIG".equalsIgnoreCase(entry.getKey()) && Boolean.TRUE.equals(entry.getValue()));
	}

	private static boolean bombSerialContainsSpecialCharacter(BombEntity bomb) {
		String serialNumber = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase();
		return serialNumber.chars().anyMatch(c -> "CLRX18".indexOf(c) >= 0);
	}

	private static int lastDigit(String value) {
		return value.chars()
			.filter(Character::isDigit)
			.map(c -> c - '0')
			.reduce((first, second) -> second)
			.orElse(-1);
	}

	private static Integer nthDigit(String value, int digitNumber) {
		int seen = 0;
		for(char c : value.toCharArray()) {
			if(Character.isDigit(c)) {
				seen++;
				if(seen == digitNumber) {
					return c - '0';
				}
			}
		}
		return null;
	}

	private static Map<MicrocontrollerType, Map<Integer, List<MicrocontrollerComponent>>> createPinLayouts() {
		Map<MicrocontrollerType, Map<Integer, List<MicrocontrollerComponent>>> layouts = new EnumMap<>(MicrocontrollerType.class);
		layouts.put(MicrocontrollerType.STRK, Map.of(
			6, List.of(MicrocontrollerComponent.AIN, MicrocontrollerComponent.VCC, MicrocontrollerComponent.RST, MicrocontrollerComponent.DIN, MicrocontrollerComponent.PWM, MicrocontrollerComponent.GND),
			8, List.of(MicrocontrollerComponent.AIN, MicrocontrollerComponent.PWM, MicrocontrollerComponent.GND, MicrocontrollerComponent.DIN, MicrocontrollerComponent.VCC, MicrocontrollerComponent.GND, MicrocontrollerComponent.RST, MicrocontrollerComponent.GND),
			10, List.of(MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.AIN, MicrocontrollerComponent.DIN, MicrocontrollerComponent.GND, MicrocontrollerComponent.VCC, MicrocontrollerComponent.RST, MicrocontrollerComponent.PWM)
		));
		layouts.put(MicrocontrollerType.LEDS, Map.of(
			6, List.of(MicrocontrollerComponent.PWM, MicrocontrollerComponent.RST, MicrocontrollerComponent.VCC, MicrocontrollerComponent.DIN, MicrocontrollerComponent.AIN, MicrocontrollerComponent.GND),
			8, List.of(MicrocontrollerComponent.PWM, MicrocontrollerComponent.DIN, MicrocontrollerComponent.VCC, MicrocontrollerComponent.GND, MicrocontrollerComponent.AIN, MicrocontrollerComponent.GND, MicrocontrollerComponent.RST, MicrocontrollerComponent.GND),
			10, List.of(MicrocontrollerComponent.PWM, MicrocontrollerComponent.AIN, MicrocontrollerComponent.DIN, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.RST, MicrocontrollerComponent.VCC, MicrocontrollerComponent.GND)
		));
		layouts.put(MicrocontrollerType.CNTD, Map.of(
			6, List.of(MicrocontrollerComponent.GND, MicrocontrollerComponent.AIN, MicrocontrollerComponent.PWM, MicrocontrollerComponent.VCC, MicrocontrollerComponent.DIN, MicrocontrollerComponent.RST),
			8, List.of(MicrocontrollerComponent.PWM, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.VCC, MicrocontrollerComponent.AIN, MicrocontrollerComponent.GND, MicrocontrollerComponent.DIN, MicrocontrollerComponent.RST),
			10, List.of(MicrocontrollerComponent.PWM, MicrocontrollerComponent.DIN, MicrocontrollerComponent.AIN, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.VCC, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.RST, MicrocontrollerComponent.GND)
		));
		layouts.put(MicrocontrollerType.EXPL, Map.of(
			6, List.of(MicrocontrollerComponent.PWM, MicrocontrollerComponent.VCC, MicrocontrollerComponent.RST, MicrocontrollerComponent.AIN, MicrocontrollerComponent.DIN, MicrocontrollerComponent.GND),
			8, List.of(MicrocontrollerComponent.AIN, MicrocontrollerComponent.GND, MicrocontrollerComponent.RST, MicrocontrollerComponent.GND, MicrocontrollerComponent.VCC, MicrocontrollerComponent.GND, MicrocontrollerComponent.DIN, MicrocontrollerComponent.PWM),
			10, List.of(MicrocontrollerComponent.RST, MicrocontrollerComponent.DIN, MicrocontrollerComponent.VCC, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.GND, MicrocontrollerComponent.AIN, MicrocontrollerComponent.GND, MicrocontrollerComponent.PWM, MicrocontrollerComponent.GND)
		));
		return layouts;
	}

	private record ColorRule(
		String description,
		Map<MicrocontrollerComponent, MicrocontrollerColor> colors
	) {
	}
}
