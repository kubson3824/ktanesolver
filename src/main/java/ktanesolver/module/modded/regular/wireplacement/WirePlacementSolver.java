package ktanesolver.module.modded.regular.wireplacement;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.wireplacement.WirePlacementInput.Wire;
import ktanesolver.module.modded.regular.wireplacement.WirePlacementInput.WireColor;
import ktanesolver.module.modded.regular.wireplacement.WirePlacementOutput.CutWire;

@Service
@ModuleInfo(
	type = ModuleType.WIRE_PLACEMENT,
	id = "WirePlacementModule",
	name = "Wire Placement",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine which grid wires to cut from their colors and endpoints.",
	tags = {"wires", "grid", "lookup"}
)
public class WirePlacementSolver extends AbstractModuleSolver<WirePlacementInput, WirePlacementOutput> {
	private static final List<WireColor> ROW_COLORS = List.of(
		WireColor.YELLOW, WireColor.BLUE, WireColor.WHITE, WireColor.WHITE, WireColor.RED,
		WireColor.BLUE, WireColor.BLACK, WireColor.RED, WireColor.YELLOW, WireColor.YELLOW
	);
	private static final Map<WireColor, List<String>> TARGETS = Map.of(
		WireColor.BLACK, List.of("D2", "A2", "D3", "B2", "A1", "C3", "B1", "C4", "A3", "D1"),
		WireColor.BLUE, List.of("D1", "C4", "D2", "C1", "B3", "C2", "D4", "D3", "C3", "A1"),
		WireColor.RED, List.of("D2", "A1", "D4", "B4", "C4", "C1", "A4", "B1", "A2", "B2"),
		WireColor.WHITE, List.of("A2", "C4", "B3", "A1", "B2", "D3", "D2", "C1", "A4", "B4"),
		WireColor.YELLOW, List.of("D1", "D4", "B2", "C1", "B3", "B1", "B4", "C2", "A3", "A4")
	);

	@Override
	protected SolveResult<WirePlacementOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, WirePlacementInput input
	) {
		if (input == null || input.wires() == null || input.wires().size() != 8)
			return failure("Wire Placement requires exactly 8 wires");

		List<Wire> wires = new ArrayList<>();
		Set<String> used = new HashSet<>();
		for (Wire wire : input.wires()) {
			if (wire == null || wire.from() == null || wire.to() == null || wire.color() == null)
				return failure("Each wire needs two endpoints and a color");
			String from = wire.from().trim().toUpperCase(Locale.ROOT);
			String to = wire.to().trim().toUpperCase(Locale.ROOT);
			if (!from.matches("[A-D][1-4]") || !to.matches("[A-D][1-4]") || !adjacent(from, to))
				return failure("Wire endpoints must be adjacent coordinates from A1 to D4");
			if (!used.add(from) || !used.add(to)) return failure("Each grid coordinate must belong to exactly one wire");
			wires.add(new Wire(from, to, wire.color()));
		}

		WireColor referenceColor = wires.stream()
			.filter(wire -> connected(wire, "C3"))
			.findFirst().orElseThrow().color();
		List<CutWire> cuts = new ArrayList<>();
		for (int wireIndex = 0; wireIndex < wires.size(); wireIndex++) {
			Wire wire = wires.get(wireIndex);
			for (int row = 0; row < ROW_COLORS.size(); row++) {
				String target = TARGETS.get(referenceColor).get(row);
				if (wire.color() == ROW_COLORS.get(row) && connected(wire, target)) {
					cuts.add(new CutWire(wireIndex + 1, target, wire.color()));
					break;
				}
			}
		}

		storeState(module, "wires", wires);
		return success(new WirePlacementOutput(referenceColor, List.copyOf(cuts)));
	}

	private static boolean adjacent(String a, String b) {
		return Math.abs(a.charAt(0) - b.charAt(0)) + Math.abs(a.charAt(1) - b.charAt(1)) == 1;
	}

	private static boolean connected(Wire wire, String coordinate) {
		return wire.from().equals(coordinate) || wire.to().equals(coordinate);
	}
}
