
package ktanesolver.module.modded.regular.plumbing;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.PLUMBING,
	id = "plumbing",
	name = "Plumbing",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine which input and output pipes are active; connect active inputs to active outputs via the 6×6 grid.",
	tags = { "plumbing", "modded" }
)
public class PlumbingSolver extends AbstractModuleSolver<PlumbingInput, PlumbingOutput> {

	@Override
	protected SolveResult<PlumbingOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, PlumbingInput input) {
		boolean redIn = isRedInputActive(bomb);
		boolean yellowIn = isYellowInputActive(bomb);
		boolean greenIn = isGreenInputActive(bomb);
		boolean blueIn = isBlueInputActive(bomb, redIn, yellowIn, greenIn);

		List<Boolean> activeInputs = List.of(redIn, yellowIn, greenIn, blueIn);

		boolean redOut = isRedOutputActive(bomb, activeInputs);
		boolean yellowOut = isYellowOutputActive(bomb, greenIn);
		boolean greenOut = isGreenOutputActive(bomb, activeInputs);
		boolean blueOut = isBlueOutputActive(bomb, activeInputs, redOut, yellowOut, greenOut);

		List<Boolean> activeOutputs = List.of(redOut, yellowOut, greenOut, blueOut);

		return success(new PlumbingOutput(activeInputs, activeOutputs));
	}

	// --- Red Input: Against duplicate serial chars, duplicate ports; For exactly 1 RJ45, serial contains '1'
	private boolean isRedInputActive(BombEntity bomb) {
		int forCount = 0;
		if (getPortCount(bomb, PortType.RJ45) == 1) forCount++;
		if (serialContains(bomb, '1')) forCount++;
		int againstCount = 0;
		if (hasDuplicateSerialCharacters(bomb)) againstCount++;
		if (hasDuplicatePorts(bomb)) againstCount++;
		return forCount > againstCount;
	}

	// --- Yellow Input: Against serial '1' or 'L', no duplicate ports; For Stereo RCA, serial '2'
	private boolean isYellowInputActive(BombEntity bomb) {
		int forCount = 0;
		if (bomb.hasPort(PortType.STEREO_RCA)) forCount++;
		if (serialContains(bomb, '2')) forCount++;
		int againstCount = 0;
		if (serialContains(bomb, '1') || serialContains(bomb, 'L')) againstCount++;
		if (!hasDuplicatePorts(bomb)) againstCount++;
		return forCount > againstCount;
	}

	// --- Green Input: Against Yellow inactive, Red inactive; For DVI-D, serial has 3+ digits
	private boolean isGreenInputActive(BombEntity bomb) {
		boolean redIn = isRedInputActive(bomb);
		boolean yellowIn = isYellowInputActive(bomb);
		int forCount = 0;
		if (bomb.hasPort(PortType.DVI)) forCount++;
		if (countDigitsInSerial(bomb) >= 3) forCount++;
		int againstCount = 0;
		if (!yellowIn) againstCount++;
		if (!redIn) againstCount++;
		return forCount > againstCount;
	}

	// --- Blue Input: Against no batteries, no ports; For 4+ batteries, 4+ port types. Always active if all others inactive.
	private boolean isBlueInputActive(BombEntity bomb, boolean redIn, boolean yellowIn, boolean greenIn) {
		if (!redIn && !yellowIn && !greenIn) return true;
		int forCount = 0;
		if (bomb.getBatteryCount() >= 4) forCount++;
		if (getDistinctPortTypeCount(bomb) >= 4) forCount++;
		int againstCount = 0;
		if (bomb.getBatteryCount() == 0) againstCount++;
		if (getTotalPortCount(bomb) == 0) againstCount++;
		return forCount > againstCount;
	}

	// --- Red Output: Against more than 2 inputs active, serial more than 2 digits; For exactly one battery, Serial port
	private boolean isRedOutputActive(BombEntity bomb, List<Boolean> activeInputs) {
		long activeIn = activeInputs.stream().filter(Boolean::booleanValue).count();
		int forCount = 0;
		if (bomb.getBatteryCount() == 1) forCount++;
		if (bomb.hasPort(PortType.SERIAL)) forCount++;
		int againstCount = 0;
		if (activeIn > 2) againstCount++;
		if (countDigitsInSerial(bomb) > 2) againstCount++;
		return forCount > againstCount;
	}

	// --- Yellow Output: Against Green input active, serial doesn't contain '2'; For serial '4' or '8', duplicate ports
	private boolean isYellowOutputActive(BombEntity bomb, boolean greenIn) {
		int forCount = 0;
		if (serialContains(bomb, '4') || serialContains(bomb, '8')) forCount++;
		if (hasDuplicatePorts(bomb)) forCount++;
		int againstCount = 0;
		if (greenIn) againstCount++;
		if (!serialContains(bomb, '2')) againstCount++;
		return forCount > againstCount;
	}

	// --- Green Output: Against serial more than 3 digits, less than 3 ports; For exactly 3 ports, exactly 3 inputs active
	private boolean isGreenOutputActive(BombEntity bomb, List<Boolean> activeInputs) {
		long activeIn = activeInputs.stream().filter(Boolean::booleanValue).count();
		int totalPorts = getTotalPortCount(bomb);
		int forCount = 0;
		if (totalPorts == 3) forCount++;
		if (activeIn == 3) forCount++;
		int againstCount = 0;
		if (countDigitsInSerial(bomb) > 3) againstCount++;
		if (totalPorts < 3) againstCount++;
		return forCount > againstCount;
	}

	// --- Blue Output: Against no Parallel, less than 2 batteries; For any other output inactive, all inputs active. Always active if all others inactive.
	private boolean isBlueOutputActive(BombEntity bomb, List<Boolean> activeInputs,
		boolean redOut, boolean yellowOut, boolean greenOut) {
		if (!redOut && !yellowOut && !greenOut) return true;
		long activeIn = activeInputs.stream().filter(Boolean::booleanValue).count();
		boolean allInputsActive = activeIn == 4;
		int forCount = 0;
		if (!redOut || !yellowOut || !greenOut) forCount++;
		if (allInputsActive) forCount++;
		int againstCount = 0;
		if (!bomb.hasPort(PortType.PARALLEL)) againstCount++;
		if (bomb.getBatteryCount() < 2) againstCount++;
		return forCount > againstCount;
	}

	private static boolean serialContains(BombEntity bomb, char c) {
		String s = bomb.getSerialNumber();
		return s != null && s.toUpperCase().indexOf(Character.toUpperCase(c)) >= 0;
	}

	private static int countDigitsInSerial(BombEntity bomb) {
		String s = bomb.getSerialNumber();
		return s == null ? 0 : (int) s.chars().filter(Character::isDigit).count();
	}

	private static boolean hasDuplicateSerialCharacters(BombEntity bomb) {
		String s = bomb.getSerialNumber();
		if (s == null || s.isEmpty()) return false;
		Set<Integer> seen = s.toUpperCase().chars().boxed().collect(Collectors.toSet());
		return s.length() != seen.size();
	}

	private static boolean hasDuplicatePorts(BombEntity bomb) {
		List<PortType> all = bomb.getPortPlates().stream()
			.flatMap(p -> p.getPorts().stream())
			.collect(Collectors.toList());
		return all.size() != all.stream().distinct().count();
	}

	private static int getTotalPortCount(BombEntity bomb) {
		return bomb.getPortPlates().stream()
			.mapToInt(p -> p.getPorts().size())
			.sum();
	}

	private static long getDistinctPortTypeCount(BombEntity bomb) {
		Set<PortType> distinct = bomb.getPortPlates().stream()
			.flatMap(p -> p.getPorts().stream())
			.collect(Collectors.toSet());
		return distinct.size();
	}

	private static int getPortCount(BombEntity bomb, PortType type) {
		return (int) bomb.getPortPlates().stream()
			.filter(p -> p.getPorts().contains(type))
			.count();
	}
}
