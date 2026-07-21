package ktanesolver.module.modded.regular.sink;

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
import ktanesolver.module.modded.regular.sink.SinkOutput.Knob;

@Service
@ModuleInfo(
	type = ModuleType.SINK,
	id = "sink",
	name = "Sink",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the three Hot and Cold knob turns from the sink materials and bomb edgework",
	tags = {"edgework", "sequence", "knobs", "modded"}
)
public class SinkSolver extends AbstractModuleSolver<SinkInput, SinkOutput> {
	private static final int[][] RULES = {{1, 0, 3}, {2, 5, 1}, {4, 2, 0}, {4, 5, 3}};

	@Override
	protected SolveResult<SinkOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SinkInput input
	) {
		if (input == null) return failure("Enter the sink materials and HDMI port status");
		if (bomb.getSerialNumber() == null || bomb.getSerialNumber().isBlank()) return failure("Serial number is required");

		boolean[] conditions = {
			bomb.isIndicatorUnlit("NSA"),
			bomb.serialHasVowel(),
			input.goldPlatedKnobs(),
			input.stainlessSteelFaucet(),
			input.copperDrainPipe(),
			input.hasHdmiPort() || bomb.hasPort(PortType.RJ45)
		};
		int batteryBand = Math.min(bomb.getBatteryCount() / 2, 3);
		boolean hotWhenTrue = batteryBand == 0 || batteryBand == 3;
		List<Knob> sequence = Arrays.stream(RULES[batteryBand])
			.mapToObj(rule -> conditions[rule] == hotWhenTrue ? Knob.HOT : Knob.COLD)
			.toList();
		storeState(module, "input", input);
		return success(new SinkOutput(sequence));
	}
}
