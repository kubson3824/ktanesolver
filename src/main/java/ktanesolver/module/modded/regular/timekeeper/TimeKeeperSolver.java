package ktanesolver.module.modded.regular.timekeeper;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;

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
import ktanesolver.module.modded.regular.timekeeper.TimeKeeperInput.Color;

@Service
@ModuleInfo(
	type = ModuleType.THE_TIME_KEEPER,
	id = "timeKeeper",
	name = "The Time Keeper",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the display, LEDs, activation month, and bomb edgework to find the correct LED and time.",
	tags = {"time", "colors", "edgework", "leds"}
)
public class TimeKeeperSolver extends AbstractModuleSolver<TimeKeeperInput, TimeKeeperOutput> {
	@Override
	protected SolveResult<TimeKeeperOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TimeKeeperInput input
	) {
		if (input == null || input.displayedNumber() == null || input.displayedColor() == null
			|| input.ledColors() == null || input.activationMonth() == null) {
			return failure("Enter the displayed number and color, all three LED colors, and activation month");
		}
		if (input.displayedNumber() < 1 || input.displayedNumber() > 50) {
			return failure("Displayed number must be between 1 and 50");
		}
		if (input.activationMonth() < 1 || input.activationMonth() > 12) {
			return failure("Activation month must be between 1 and 12");
		}
		List<Color> leds = input.ledColors();
		if (leds.size() != 3 || leds.stream().anyMatch(color -> color == null)) {
			return failure("Enter exactly three LED colors in reading order");
		}
		if (bomb.getSerialNumber() == null) return failure("The bomb serial number is required");

		int value = input.displayedNumber();
		for (char character : bomb.getSerialNumber().toUpperCase().toCharArray()) {
			if (character >= 'A' && character <= 'Z') value += character - 'A' + 1;
			else if (character >= '0' && character <= '9') value -= character - '0';
		}
		if (leds.get(0) == Color.WHITE) value += 14;
		value += leds.get(1) == input.displayedColor() ? 22 : 13;
		value += 2 * bomb.getPortPlates().size();
		if (bomb.hasPort(PortType.DVI)) value -= 9;

		int correctLed = leds.get(0) == leds.get(1) && leds.get(0) == leds.get(2) ? 0 : -1;
		if (EnumSet.of(Color.RED, Color.GREEN, Color.BLUE).contains(input.displayedColor())
			&& !leds.contains(Color.YELLOW)) value += input.displayedNumber();
		long solvableModules = bomb.getModules().stream().filter(candidate -> !candidate.getType().isNeedy()).count();
		if (solvableModules > bomb.getBatteryCount() + bomb.getBatteryHolders()) value -= 18;
		if (value > 72 && value % 2 == 0) value /= 2;

		boolean ruleNineApplied = false;
		if ((leds.get(1) == Color.GREEN || leds.get(1) == Color.BLACK) && correctLed < 0) {
			correctLed = 1;
			ruleNineApplied = true;
		}
		int portCount = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		if (Math.floorMod(value, 23) < 2 * portCount) return finish(bomb, input, value, correctLed);

		value += input.activationMonth();
		value = input.displayedNumber() > 23 ? value + bomb.getBatteryHolders() : value * bomb.getBatteryHolders();
		Map<String, Boolean> indicators = bomb.getIndicators();
		value += 2 * indicators.values().stream().filter(Boolean.TRUE::equals).count();
		value -= 3 * indicators.values().stream().filter(Boolean.FALSE::equals).count();
		if (leds.get(2) == leds.get(0) && leds.get(0) == input.displayedColor() && leds.get(1) != leds.get(0)) {
			if (correctLed < 0) correctLed = 2;
			return finish(bomb, input, value, correctLed);
		}

		value += ruleNineApplied ? 10 : -19;
		if (value < 0) return finish(bomb, input, value * -2, correctLed);
		value *= 3;
		if (leds.stream().mapToInt(color -> color.name().length()).sum() > 13) {
			value += input.displayedColor().name().length();
		}
		if (bomb.getPortPlates().isEmpty()) return finish(bomb, input, value, correctLed);

		if (!bomb.hasIndicator("FRK") && correctLed < 0) {
			int first = leds.get(0).name().length();
			int second = leds.get(1).name().length();
			int third = leds.get(2).name().length();
			if (first > second && first > third) correctLed = 0;
			else if (second > first && second > third) correctLed = 1;
			else if (third > first && third > second) correctLed = 2;
		}
		List<String> unlit = indicators.entrySet().stream()
			.filter(entry -> Boolean.FALSE.equals(entry.getValue()))
			.map(Map.Entry::getKey).filter(label -> label != null && !label.isEmpty()).toList();
		if (unlit.isEmpty()) value *= 3;
		else for (String label : unlit) value += Character.toUpperCase(label.charAt(0)) - 'A' + 1;
		return finish(bomb, input, value, correctLed);
	}

	private SolveResult<TimeKeeperOutput> finish(BombEntity bomb, TimeKeeperInput input, int value, int correctLed) {
		if (value < 0) value = -value;
		if (value < 10) value += 13;
		if (correctLed < 0) {
			List<Color> leds = input.ledColors();
			if (value < 100) correctLed = 0;
			else if (input.displayedColor() == Color.GREEN && leds.get(0) != Color.GREEN) correctLed = 2;
			else if (EnumSet.copyOf(leds).size() == 3 && !leds.contains(input.displayedColor())) correctLed = 0;
			else if (bomb.hasPort(PortType.PARALLEL)) correctLed = 1;
			else correctLed = 2;
		}
		return success(new TimeKeeperOutput(correctLed + 1, value));
	}
}
