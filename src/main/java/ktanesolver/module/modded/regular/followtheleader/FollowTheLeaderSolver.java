package ktanesolver.module.modded.regular.followtheleader;

import java.util.ArrayList;
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
import ktanesolver.module.modded.regular.followtheleader.FollowTheLeaderInput.WireColor;

@Service
@ModuleInfo(type = ModuleType.FOLLOW_THE_LEADER, id = "follow-the-leader", name = "Follow the Leader", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Determine which wires to cut and in what order.", tags = {"wires", "sequence", "edgework"})
public class FollowTheLeaderSolver extends AbstractModuleSolver<FollowTheLeaderInput, FollowTheLeaderOutput> {
	private static final Set<WireColor> REVERSE_COLORS = Set.of(WireColor.RED, WireColor.GREEN, WireColor.WHITE);

	@Override
	protected SolveResult<FollowTheLeaderOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, FollowTheLeaderInput input) {
		if (input == null || input.wiresByPlug() == null || input.wiresByPlug().size() != 12)
			return failure("Provide one wire color or no wire for each of the 12 plugs");

		List<Wire> wires = new ArrayList<>();
		for (int plug = 1; plug <= 12; plug++) {
			WireColor color = input.wiresByPlug().get(plug - 1);
			if (color != null) wires.add(new Wire(plug, color));
		}
		if (wires.size() < 8 || wires.size() > 12)
			return failure("Follow the Leader requires 8 to 12 wires");

		storeState(module, "wiresByPlug", input.wiresByPlug());
		int startIndex = findStart(wires, bomb);
		if (startIndex < 0) {
			List<Integer> descending = wires.stream().map(Wire::plug).sorted((a, b) -> b - a).toList();
			return success(new FollowTheLeaderOutput(descending.get(0), descending, "DESCENDING", true));
		}

		boolean reverse = REVERSE_COLORS.contains(wires.get(startIndex).color());
		int step = firstLetter(bomb.getSerialNumber()) % 13;
		List<Boolean> cuts = new ArrayList<>();
		List<Integer> cutPlugs = new ArrayList<>();
		for (int offset = 0; offset < wires.size(); offset++) {
			int index = (startIndex + offset) % wires.size();
			boolean cut = offset == 0 || evaluate(step, index, wires, cuts);
			cuts.add(cut);
			if (cut) cutPlugs.add(wires.get(index).plug());
			if (offset > 0) step = Math.floorMod(step + (reverse ? -1 : 1), 13);
		}
		return success(new FollowTheLeaderOutput(wires.get(startIndex).plug(), List.copyOf(cutPlugs), reverse ? "REVERSE" : "FORWARD", false));
	}

	private static int findStart(List<Wire> wires, BombEntity bomb) {
		if (bomb.hasPort(PortType.RJ45) && indexOfPlug(wires, 4) >= 0 && next(wires, indexOfPlug(wires, 4)).plug() == 5) return indexOfPlug(wires, 4);
		int index = indexOfPlug(wires, bomb.getBatteryCount());
		if (index >= 0) return index;
		int firstDigit = bomb.getSerialNumber().chars().filter(Character::isDigit).map(c -> c - '0').findFirst().orElse(-1);
		index = indexOfPlug(wires, firstDigit);
		if (index >= 0) return index;
		if (bomb.isIndicatorLit("CLR")) return -1;
		return 0;
	}

	private static boolean evaluate(int step, int index, List<Wire> wires, List<Boolean> cuts) {
		Wire current = wires.get(index);
		Wire previous = previous(wires, index, 1);
		Wire previous2 = previous(wires, index, 2);
		Wire previous3 = previous(wires, index, 3);
		boolean previousCut = cuts.get(cuts.size() - 1);
		return switch (step) {
			case 0 -> !Set.of(WireColor.YELLOW, WireColor.BLUE, WireColor.GREEN).contains(previous.color());
			case 1 -> current.plug() % 2 == 0;
			case 2 -> previousCut;
			case 3 -> Set.of(WireColor.RED, WireColor.BLUE, WireColor.BLACK).contains(previous.color());
			case 4 -> previous.color() == previous2.color() || previous.color() == previous3.color() || previous2.color() == previous3.color();
			case 5 -> (previous.color() == current.color()) ^ (previous2.color() == current.color());
			case 6 -> Set.of(WireColor.YELLOW, WireColor.WHITE, WireColor.GREEN).contains(previous.color());
			case 7 -> !previousCut;
			case 8 -> nextPlug(previous.plug()) != current.plug();
			case 9 -> !Set.of(WireColor.WHITE, WireColor.BLACK, WireColor.RED).contains(previous.color());
			case 10 -> previous.color() != previous2.color();
			case 11 -> current.plug() > 6;
			default -> !(isWhiteOrBlack(previous) && isWhiteOrBlack(previous2));
		};
	}

	private static int firstLetter(String serial) {
		return serial == null ? 0 : serial.toUpperCase().chars().filter(Character::isLetter).map(c -> c - 'A').findFirst().orElse(0);
	}

	private static boolean isWhiteOrBlack(Wire wire) { return wire.color() == WireColor.WHITE || wire.color() == WireColor.BLACK; }
	private static int nextPlug(int plug) { return plug % 12 + 1; }
	private static Wire next(List<Wire> wires, int index) { return wires.get((index + 1) % wires.size()); }
	private static Wire previous(List<Wire> wires, int index, int count) { return wires.get(Math.floorMod(index - count, wires.size())); }
	private static int indexOfPlug(List<Wire> wires, int plug) {
		for (int i = 0; i < wires.size(); i++) if (wires.get(i).plug() == plug) return i;
		return -1;
	}

	private record Wire(int plug, WireColor color) {}
}
