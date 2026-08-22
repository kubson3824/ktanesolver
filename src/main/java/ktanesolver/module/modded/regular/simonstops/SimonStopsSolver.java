package ktanesolver.module.modded.regular.simonstops;

import java.util.ArrayList;
import java.util.List;
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
import ktanesolver.module.modded.regular.simonstops.SimonStopsInput.Color;

@Service
@ModuleInfo(type = ModuleType.SIMON_STOPS, id = "simonStops", name = "Simon Stops",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Translate each flash sequence, then supply the timed Control Input when the module stops normal entry.",
	tags = {"simon", "colors", "multi-stage", "timing"})
public class SimonStopsSolver extends AbstractModuleSolver<SimonStopsInput, SimonStopsOutput> {
	@Override protected SolveResult<SimonStopsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SimonStopsInput input) {
		int stage = module.getState().get("simonStopsStage") instanceof Number value ? value.intValue() : 1;
		if (stage < 1 || stage > 3) return failure("The saved Simon Stops stage is invalid");
		if (input == null || input.flashedColors() == null || input.flashedColors().size() != stage + 2 || input.flashedColors().stream().anyMatch(c -> c == null))
			return failure("Stage " + stage + " needs exactly " + (stage + 2) + " flashed colors");
		String serial = bomb.getSerialNumber();
		if (serial == null || !serial.matches("[A-Za-z0-9]{6}") || serial.chars().noneMatch(Character::isDigit)) return failure("A six-character serial number containing a digit is required");

		List<Color> normal = input.flashedColors().stream().map(color -> normal(stage, color, bomb.getBatteryCount())).toList();
		storeState(module, "simonStopsFlashedColors", input.flashedColors().stream().map(SimonStopsSolver::display).toList());
		if (input.normalPressesCompleted() == null) {
			storeState(module, Map.of("simonStopsStage", stage, "simonStopsAwaitingControl", true));
			return success(new SimonStopsOutput(stage, normal, true, stage), false);
		}

		int completed = input.normalPressesCompleted();
		if (completed < 1 || completed > stage + 1) return failure("The module can stop after 1 through " + (stage + 1) + " normal presses in stage " + stage);
		Color control = control(stage, normal.get(completed - 1), bomb);
		List<Color> continuation = new ArrayList<>(); continuation.add(control); continuation.addAll(normal.subList(completed, normal.size()));
		int nextStage = Math.min(3, stage + 1);
		storeState(module, Map.of("simonStopsStage", nextStage, "simonStopsAwaitingControl", false));
		return success(new SimonStopsOutput(stage, List.copyOf(continuation), false, nextStage), stage == 3);
	}

	private static Color normal(int stage, Color flash, int batteries) {
		int index = flash.ordinal();
		return Color.values()[switch (stage) {
			case 1 -> switch (index) { case 0 -> 4; case 1 -> (1 + batteries) % 6; case 2 -> 2; case 3 -> 0; case 4 -> 5; default -> (5 + batteries) % 6; };
			case 2 -> switch (index) { case 0 -> batteries % 6; case 1 -> 2; case 2 -> (2 + batteries) % 6; case 3 -> 5; case 4 -> 1; default -> 4; };
			default -> switch (index) { case 0 -> 2; case 1 -> 1; case 2 -> 3; case 3 -> (3 + batteries) % 6; case 4 -> (4 + batteries) % 6; default -> 0; };
		}];
	}

	private static Color control(int stage, Color previous, BombEntity bomb) {
		int value = bomb.getLastDigit();
		if (stage == 1) value += (int) bomb.getSerialNumber().toUpperCase().chars().filter(Character::isLetter).filter(c -> "AEIOU".indexOf(c) < 0).count() * bomb.getBatteryCount();
		else if (stage == 2) value += bomb.getPortPlates().stream().mapToInt(p -> p.getPorts().size()).sum() * 2 + bomb.getBatteryHolders();
		else value += 2 + (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count() * 3 + (int) bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		String rule = switch (stage) {
			case 1 -> List.of("SC", "N1", "PS", "P1", "N2", "OP", "NS", "P2", "PP", "NP").get(value % 10);
			case 2 -> List.of("P1", "NP", "PP", "SC", "OP", "PS", "P2", "N1", "NS", "N2").get(value % 10);
			default -> List.of("OP", "N1", "P1", "NS", "P2", "PP", "PS", "SC", "NP", "N2").get(value % 10);
		};
		int base = previous.ordinal(); boolean primary = base % 2 == 0;
		int offset = switch (rule) {
			case "SC" -> 0; case "N1" -> 1; case "P1" -> -1; case "N2" -> 2; case "P2" -> -2; case "OP" -> 3;
			case "NS" -> primary ? 1 : 2; case "PS" -> primary ? -1 : -2; case "NP" -> primary ? 2 : 1; default -> primary ? -2 : -1;
		};
		return Color.values()[Math.floorMod(base + offset, 6)];
	}

	private static String display(Color color) { return color.name().charAt(0) + color.name().substring(1).toLowerCase(); }
}
