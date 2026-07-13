package ktanesolver.module.modded.regular.complicatedbuttons;

import java.util.Arrays;
import java.util.List;

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
import ktanesolver.module.modded.regular.complicatedbuttons.ComplicatedButtonsInput.Button;
import ktanesolver.module.modded.regular.complicatedbuttons.ComplicatedButtonsInput.Label;

@Service
@ModuleInfo(
	type = ModuleType.COMPLICATED_BUTTONS,
	id = "complicatedButtonsModule",
	name = "Complicated Buttons",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Press the three colored buttons in the order allowed by the Venn diagram",
	tags = {"buttons", "colors", "edgework", "sequence", "modded"}
)
public class ComplicatedButtonsSolver extends AbstractModuleSolver<ComplicatedButtonsInput, ComplicatedButtonsOutput> {
	private static final String INSTRUCTIONS = "PDPBRSDSRBPBRRSD";
	private static final int[][][] ORDERS = {
		{{1, 2, 3}, {2, 3, 1}, {3, 1, 2}, {1, 2, 3}},
		{{2, 1, 3}, {3, 2, 1}, {1, 3, 2}, {2, 3, 1}},
		{{3, 1, 2}, {1, 2, 3}, {2, 1, 3}, {3, 1, 2}}
	};

	@Override
	protected SolveResult<ComplicatedButtonsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ComplicatedButtonsInput input
	) {
		if(input == null || input.buttons() == null || input.buttons().size() != 3) {
			return failure("Enter exactly three buttons");
		}
		if(input.buttons().stream().anyMatch(button -> button == null || button.label() == null)) {
			return failure("Each button needs a label and color");
		}

		boolean repeatedSerialCharacter = bomb.getSerialNumber() != null
			&& bomb.getSerialNumber().chars().distinct().count() < bomb.getSerialNumber().length();
		boolean serialPort = bomb.hasPort(PortType.SERIAL);
		boolean twoBatteryHolders = bomb.getBatteryHolders() >= 2;
		int[] configuredOrder = ORDERS[input.buttons().getFirst().label().ordinal()][Math.min(3, bomb.getBatteryCount() / 2)];
		List<Integer> pressOrder = Arrays.stream(configuredOrder)
			.filter(position -> shouldPress(input.buttons().get(position - 1), position == 2, repeatedSerialCharacter, serialPort, twoBatteryHolders))
			.boxed()
			.toList();
		if(pressOrder.isEmpty()) pressOrder = List.of(configuredOrder[1]);

		storeState(module, "input", input);
		return success(new ComplicatedButtonsOutput(pressOrder));
	}

	private static boolean shouldPress(
		Button button, boolean middle, boolean repeatedSerialCharacter, boolean serialPort, boolean twoBatteryHolders
	) {
		int index = (middle ? 1 : 0) + (button.label() == Label.PRESS ? 2 : 0)
			+ (button.blue() ? 4 : 0) + (button.red() ? 8 : 0);
		return switch(INSTRUCTIONS.charAt(index)) {
			case 'P' -> true;
			case 'R' -> repeatedSerialCharacter;
			case 'S' -> serialPort;
			case 'B' -> twoBatteryHolders;
			default -> false;
		};
	}
}
