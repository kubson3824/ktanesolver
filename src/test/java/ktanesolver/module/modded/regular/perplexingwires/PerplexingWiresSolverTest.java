package ktanesolver.module.modded.regular.perplexingwires;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.perplexingwires.PerplexingWiresInput.ArrowColor;
import ktanesolver.module.modded.regular.perplexingwires.PerplexingWiresInput.ArrowDirection;
import ktanesolver.module.modded.regular.perplexingwires.PerplexingWiresInput.Wire;
import ktanesolver.module.modded.regular.perplexingwires.PerplexingWiresInput.WireColor;

class PerplexingWiresSolverTest {
	private final PerplexingWiresSolver solver = new PerplexingWiresSolver();

	@Test
	void appliesIndicatorPortBatteryLedAndUsbRules() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("BC1234");
		bomb.setAaBatteryCount(4);
		bomb.setIndicators(Map.of("CAR", true));
		bomb.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.SERIAL, PortType.USB)));
		PerplexingWiresInput input = new PerplexingWiresInput(List.of(
			wire(1, WireColor.BLUE, ArrowColor.RED),
			wire(1, WireColor.WHITE, ArrowColor.BLUE),
			wire(4, WireColor.GREEN, ArrowColor.PURPLE),
			wire(4, WireColor.GREEN, ArrowColor.GREEN),
			wire(2, WireColor.BLACK, ArrowColor.BLUE),
			wire(3, WireColor.GREEN, ArrowColor.YELLOW)
		), List.of(false, false, false, true), List.of(true, true, false));

		PerplexingWiresOutput withUsb = output(bomb, input);
		assertThat(withUsb.cutFirst()).containsExactly(2);
		assertThat(withUsb.cutNormal()).containsExactly(1, 3, 4, 5, 6);
		assertThat(withUsb.cutLast()).isEmpty();

		bomb.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.SERIAL), Set.of(PortType.RJ45)));
		assertThat(output(bomb, input).cutNormal()).containsExactly(1, 3, 4, 5);
	}

	@Test
	void ordersFirstAndLastRulesAroundNormalCuts() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("BC1234");
		bomb.replacePortPlates(List.of(Set.of(PortType.USB)));
		PerplexingWiresOutput result = output(bomb, new PerplexingWiresInput(List.of(
			wire(1, WireColor.BLACK, ArrowColor.RED),
			wire(2, WireColor.PURPLE, ArrowColor.GREEN),
			wire(2, WireColor.BLUE, ArrowColor.RED),
			wire(4, WireColor.GREEN, ArrowColor.RED),
			wire(4, WireColor.ORANGE, ArrowColor.GREEN),
			wire(1, WireColor.ORANGE, ArrowColor.PURPLE)
		), List.of(false, true, true, false), List.of(true, true, false)));

		assertThat(result.cutFirst()).containsExactly(2);
		assertThat(result.cutNormal()).containsExactly(3, 4, 5, 6);
		assertThat(result.cutLast()).containsExactly(1);
	}

	@SuppressWarnings("unchecked")
	private PerplexingWiresOutput output(BombEntity bomb, PerplexingWiresInput input) {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		var result = solver.solve(new RoundEntity(), bomb, module, input);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.getState()).containsKeys("wires", "filledStars", "ledsOn");
		return ((SolveSuccess<PerplexingWiresOutput>) result).output();
	}

	private static Wire wire(int top, WireColor color, ArrowColor arrowColor) {
		return new Wire(top, color, arrowColor, ArrowDirection.UP);
	}
}
