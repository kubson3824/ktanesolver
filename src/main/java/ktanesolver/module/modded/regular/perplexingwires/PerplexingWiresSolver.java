package ktanesolver.module.modded.regular.perplexingwires;

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
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.perplexingwires.PerplexingWiresInput.ArrowDirection;
import ktanesolver.module.modded.regular.perplexingwires.PerplexingWiresInput.Wire;
import ktanesolver.module.modded.regular.perplexingwires.PerplexingWiresInput.WireColor;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.PERPLEXING_WIRES,
	id = "PerplexingWiresModule",
	name = "Perplexing Wires",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine which crossed wires to cut and in what order.",
	tags = {"wires", "venn diagram", "edgework"}
)
public class PerplexingWiresSolver extends AbstractModuleSolver<PerplexingWiresInput, PerplexingWiresOutput> {
	private static final String RULES = "LWIPMVIFIUCCFRHHTVUDLRJBQWBPJTQD";
	private static final List<WireColor> RED_REGION = List.of(WireColor.RED, WireColor.YELLOW, WireColor.BLUE, WireColor.WHITE);

	@Override
	protected SolveResult<PerplexingWiresOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PerplexingWiresInput input
	) {
		if (input == null || input.wires() == null || input.wires().size() != 6)
			return failure("Perplexing Wires requires exactly 6 wires");
		if (!booleans(input.filledStars(), 4) || !booleans(input.ledsOn(), 3))
			return failure("Enter all 4 stars and all 3 LEDs");
		for (Wire wire : input.wires())
			if (wire == null || wire.topConnector() < 1 || wire.topConnector() > 4 || wire.color() == null || wire.arrowColor() == null || wire.arrowDirection() == null)
				return failure("Each wire needs a top connector from 1 to 4, wire color, arrow color, and arrow direction");

		List<Integer> first = new ArrayList<>();
		List<Integer> normal = new ArrayList<>();
		List<Integer> last = new ArrayList<>();
		for (int i = 0; i < input.wires().size(); i++) {
			Wire wire = input.wires().get(i);
			char rule = RULES.charAt(mask(input, i));
			if (rule == 'F') first.add(i + 1);
			else if (rule == 'L') last.add(i + 1);
			else if (shouldCut(rule, input, bomb, i)) normal.add(i + 1);
		}
		if (first.isEmpty() && normal.isEmpty() && last.isEmpty())
			return failure("No wires would be cut; recheck the module input");

		storeState(module, Map.of("wires", input.wires(), "filledStars", input.filledStars(), "ledsOn", input.ledsOn()));
		return success(new PerplexingWiresOutput(List.copyOf(first), List.copyOf(normal), List.copyOf(last)));
	}

	private static boolean booleans(List<Boolean> values, int size) {
		return values != null && values.size() == size && values.stream().noneMatch(value -> value == null);
	}

	private static int mask(PerplexingWiresInput input, int index) {
		Wire wire = input.wires().get(index);
		int mask = crosses(input.wires(), index) ? 1 : 0;
		if (input.filledStars().get(wire.topConnector() - 1)) mask += 2;
		if ((index + 1) % 2 == 0) mask += 4;
		if (RED_REGION.contains(wire.color())) mask += 8;
		if (wire.color().name().equals(wire.arrowColor().name())) mask += 16;
		return mask;
	}

	private static boolean crosses(List<Wire> wires, int index) {
		Wire wire = wires.get(index);
		for (int other = 0; other < wires.size(); other++)
			if ((other - index) * (wires.get(other).topConnector() - wire.topConnector()) < 0) return true;
		return false;
	}

	private static boolean shouldCut(char rule, PerplexingWiresInput input, BombEntity bomb, int index) {
		Wire wire = input.wires().get(index);
		int position = index + 1;
		return switch (rule) {
			case 'C' -> true;
			case 'W' -> input.ledsOn().stream().filter(Boolean::booleanValue).count() > 1;
			case 'T' -> input.ledsOn().get(0);
			case 'U' -> wire.arrowDirection() == ArrowDirection.UP || wire.arrowDirection() == ArrowDirection.DOWN;
			case 'M' -> wire.arrowDirection() == ArrowDirection.DOWN || wire.arrowDirection() == ArrowDirection.RIGHT;
			case 'H' -> input.wires().stream().filter(other -> other.topConnector() == wire.topConnector()).count() > 1;
			case 'P' -> position == BombEdgeworkUtils.getTotalPortCount(bomb);
			case 'B' -> position == bomb.getBatteryCount();
			case 'I' -> position == bomb.getIndicators().size();
			case 'Q' -> input.wires().stream().filter(other -> other.color() == wire.color()).count() == 1;
			case 'J' -> adjacentOrangeOrPurple(input.wires(), index - 1) || adjacentOrangeOrPurple(input.wires(), index + 1);
			case 'V' -> bomb.serialHasVowel() || bomb.hasPort(PortType.USB);
			case 'R' -> input.wires().stream().filter(other -> other.arrowDirection() == wire.arrowDirection()).count() == 1;
			default -> false;
		};
	}

	private static boolean adjacentOrangeOrPurple(List<Wire> wires, int index) {
		if (index < 0 || index >= wires.size()) return false;
		WireColor color = wires.get(index).color();
		return color == WireColor.ORANGE || color == WireColor.PURPLE;
	}
}
