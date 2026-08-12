package ktanesolver.module.modded.regular.skinnywires;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.LetterPort;
import ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.Wire;
import ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor;

@Service
@ModuleInfo(
	type = ModuleType.SKINNY_WIRES,
	id = "skinnyWires",
	name = "Skinny Wires",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine which of five colored wires between ports A–C and 1–3 to cut.",
	tags = {"wires", "colors", "ports", "priority rules"}
)
public class SkinnyWiresSolver extends AbstractModuleSolver<SkinnyWiresInput, SkinnyWiresOutput> {
	@Override
	protected SolveResult<SkinnyWiresOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SkinnyWiresInput input
	) {
		if (input == null || input.wires() == null || input.wires().size() != 5)
			return failure("Exactly five wires are required");
		List<Wire> wires = input.wires();
		if (wires.stream().anyMatch(wire -> wire == null || wire.color() == null || wire.letterPort() == null
			|| wire.numberPort() == null || wire.numberPort() < 1 || wire.numberPort() > 3))
			return failure("Every wire requires a color and ports from A–C and 1–3");
		if (wires.stream().map(SkinnyWiresSolver::coordinate).distinct().count() != 5)
			return failure("Each wire must use a different letter-number connection");

		return success(solveWires(wires));
	}

	private static SkinnyWiresOutput solveWires(List<Wire> wires) {
		Map<WireColor, Long> counts = wires.stream().collect(Collectors.groupingBy(Wire::color, Collectors.counting()));
		if (count(counts, WireColor.RED) == 1 && count(counts, WireColor.BLACK) == 1
			&& count(counts, WireColor.WHITE) == 1 && count(counts, WireColor.GREEN) == 1
			&& count(counts, WireColor.ORANGE) == 1)
			return output(wires, wire -> wire.color() == WireColor.RED, 1);
		if (wires.stream().noneMatch(wire -> wire.letterPort() == LetterPort.A)
			&& wires.stream().anyMatch(wire -> wire.numberPort() == 3 && wire.color() == WireColor.BLACK))
			return output(wires, wire -> wire.letterPort() == LetterPort.B, 2);
		if (wires.stream().filter(wire -> wire.numberPort() == 2).count() == 2
			&& wires.stream().anyMatch(wire -> wire.numberPort() == 2 && wire.color() == WireColor.GREEN))
			return output(wires, wire -> wire.numberPort() != 2, 3);
		if (counts.size() == 2) {
			WireColor color = counts.keySet().stream().min(Comparator.naturalOrder()).orElseThrow();
			return output(wires, wire -> wire.color() == color, 4);
		}
		if (hasThreeSameColorAtOnePort(wires)) {
			WireColor color = counts.keySet().stream().max(Comparator.naturalOrder()).orElseThrow();
			return output(wires, wire -> wire.color() == color, 5);
		}
		if (wires.stream().anyMatch(wire -> wire.color() == WireColor.BLUE && wire.numberPort() == 3))
			return output(wires, wire -> wire.color() == WireColor.BLUE && wire.numberPort() == 3, 6);
		if (count(counts, WireColor.GREEN) == 1 && count(counts, WireColor.ORANGE) > 0)
			return output(wires, wire -> wire.color() == WireColor.GREEN, 7);
		if (count(counts, WireColor.BLACK) == 1 && count(counts, WireColor.WHITE) == 1) {
			Wire black = wires.stream().filter(wire -> wire.color() == WireColor.BLACK).findFirst().orElseThrow();
			Wire white = wires.stream().filter(wire -> wire.color() == WireColor.WHITE).findFirst().orElseThrow();
			if ((black.numberPort() == 1) != (white.numberPort() == 1))
				return output(wires, wire -> (wire == black || wire == white) && wire.numberPort() != 1, 8);
		}
		if (wires.stream().anyMatch(wire -> wire.color() == WireColor.YELLOW && wire.letterPort() == LetterPort.C))
			return output(wires, wire -> wire.color() == WireColor.YELLOW && wire.letterPort() == LetterPort.C, 9);
		if (count(counts, WireColor.PINK) > 1)
			return output(wires, wire -> wire.color() == WireColor.PINK, 10);
		if (count(counts, WireColor.RED) > 0 && count(counts, WireColor.ORANGE) > 0 && count(counts, WireColor.BLUE) == 0)
			return output(wires, wire -> wire.color() == WireColor.ORANGE, 11);
		if (wires.stream().noneMatch(wire -> wire.numberPort() == 3))
			return output(wires, wire -> wire.numberPort() == 1, 12);
		if (wires.stream().anyMatch(wire -> wire.letterPort() == LetterPort.A && wire.numberPort() == 2))
			return output(wires, wire -> wire.letterPort() == LetterPort.A && wire.numberPort() == 2, 13);
		if (count(counts, WireColor.GREEN) == 0) {
			LetterPort port = wires.stream().map(Wire::letterPort).min(Comparator.naturalOrder()).orElseThrow();
			return output(wires, wire -> wire.letterPort() == port, 14);
		}
		if (count(counts, WireColor.BLUE) == 0) {
			int port = wires.stream().mapToInt(Wire::numberPort).max().orElseThrow();
			return output(wires, wire -> wire.numberPort() == port, 15);
		}
		if (counts.values().stream().anyMatch(value -> value > 1))
			return output(wires, wire -> count(counts, wire.color()) > 1, 16);
		if (count(counts, WireColor.YELLOW) > 0)
			return output(wires, wire -> wire.color() == WireColor.YELLOW, 17);
		if (count(counts, WireColor.BLACK) > 0)
			return output(wires, wire -> wire.color() == WireColor.BLACK, 18);
		if (count(counts, WireColor.WHITE) > 0)
			return output(wires, wire -> wire.color() == WireColor.WHITE, 19);
		return output(wires, wire -> wire.letterPort() == LetterPort.A, 20);
	}

	private static boolean hasThreeSameColorAtOnePort(List<Wire> wires) {
		return Arrays.stream(LetterPort.values()).anyMatch(port -> hasThreeSameColor(wires, wire -> wire.letterPort() == port))
			|| IntStream.rangeClosed(1, 3).anyMatch(port -> hasThreeSameColor(wires, wire -> wire.numberPort() == port));
	}

	private static boolean hasThreeSameColor(List<Wire> wires, Predicate<Wire> atPort) {
		return wires.stream().filter(atPort)
			.collect(Collectors.groupingBy(Wire::color, Collectors.counting()))
			.values().stream().anyMatch(count -> count >= 3);
	}

	private static long count(Map<WireColor, Long> counts, WireColor color) {
		return counts.getOrDefault(color, 0L);
	}

	private static SkinnyWiresOutput output(List<Wire> wires, Predicate<Wire> matches, int ruleNumber) {
		Wire wire = wires.stream().filter(matches).findFirst().orElseThrow();
		return new SkinnyWiresOutput(coordinate(wire), wire.color(), ruleNumber);
	}

	private static String coordinate(Wire wire) {
		return wire.letterPort().name() + wire.numberPort();
	}
}
