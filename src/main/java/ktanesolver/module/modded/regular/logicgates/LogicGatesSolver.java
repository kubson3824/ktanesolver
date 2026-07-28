package ktanesolver.module.modded.regular.logicgates;

import java.util.ArrayList;
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
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.logicgates.LogicGatesInput.Gate;

@Service
@ModuleInfo(
	type = ModuleType.LOGIC_GATES,
	id = "logicGates",
	name = "Logic Gates",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the seven logic gates and find the displayed input configuration that turns the circuit on.",
	tags = {"logic", "gates", "LEDs", "circuit"}
)
public class LogicGatesSolver extends AbstractModuleSolver<LogicGatesInput, LogicGatesOutput> {
	@Override
	protected SolveResult<LogicGatesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LogicGatesInput input
	) {
		if (input == null || !validBits(input.inputs(), 8) || !validBits(input.outputs(), 4))
			return failure("Enter all 8 input LEDs and all 4 output LEDs");

		List<Observation> observations = observations(module);
		observations.add(new Observation(List.copyOf(input.inputs()), List.copyOf(input.outputs())));

		List<List<Gate>> candidates = new ArrayList<>();
		for (int gate = 0; gate < 4; gate++) {
			EnumSet<Gate> matching = EnumSet.allOf(Gate.class);
			for (Observation observation : observations) {
				int offset = gate * 2;
				boolean left = observation.inputs().get(offset);
				boolean right = observation.inputs().get(offset + 1);
				boolean output = observation.outputs().get(gate);
				matching.removeIf(candidate -> evaluate(candidate, left, right) != output);
			}
			if (matching.isEmpty()) return failure("The LED observations contradict each other");
			candidates.add(List.copyOf(matching));
		}

		List<Gate> identified = candidates.stream().allMatch(candidate -> candidate.size() == 1)
			? candidates.stream().map(List::getFirst).toList() : List.of();
		if (!identified.isEmpty() && (identified.stream().distinct().count() < 3
			|| identified.stream().anyMatch(gate -> identified.stream().filter(gate::equals).count() > 2)))
			return failure("The identified gates cannot occur together on this module");

		storeState(module, "observations", observations.stream()
			.map(observation -> Map.of("inputs", observation.inputs(), "outputs", observation.outputs()))
			.toList());
		if (identified.isEmpty())
			return success(new LogicGatesOutput(candidates, List.of(), false), false);

		List<Gate> gates = new ArrayList<>(identified);
		gates.add(nextAvailable(gates.get(0), gates.get(1), gates));
		gates.add(nextAvailable(gates.get(4), gates.get(2), gates));
		gates.add(nextAvailable(gates.get(5), gates.get(3), gates));
		storeState(module, "gates", List.copyOf(gates));

		boolean ready = evaluate(gates.get(6),
			evaluate(gates.get(4), input.outputs().get(0), input.outputs().get(1)),
			evaluate(gates.get(5), input.outputs().get(2), input.outputs().get(3)));
		return success(new LogicGatesOutput(candidates, List.copyOf(gates), ready), ready);
	}

	private static boolean validBits(List<Boolean> bits, int size) {
		return bits != null && bits.size() == size && bits.stream().noneMatch(java.util.Objects::isNull);
	}

	private static Gate nextAvailable(Gate start, Gate steps, List<Gate> gates) {
		Gate candidate = Gate.values()[(start.ordinal() + steps.ordinal() + 1) % Gate.values().length];
		while (gates.stream().filter(candidate::equals).count() >= 1
			&& gates.stream().distinct().count() < gates.size()) {
			candidate = Gate.values()[(candidate.ordinal() + 1) % Gate.values().length];
		}
		return candidate;
	}

	private static boolean evaluate(Gate gate, boolean left, boolean right) {
		return switch (gate) {
			case AND -> left && right;
			case OR -> left || right;
			case XOR -> left ^ right;
			case NAND -> !(left && right);
			case NOR -> !(left || right);
			case XNOR -> left == right;
		};
	}

	private static List<Observation> observations(ModuleEntity module) {
		Object raw = module.getState().get("observations");
		if (!(raw instanceof List<?> rows)) return new ArrayList<>();
		List<Observation> result = new ArrayList<>();
		for (Object row : rows) {
			if (!(row instanceof Map<?, ?> map)) continue;
			List<Boolean> inputs = booleans(map.get("inputs"));
			List<Boolean> outputs = booleans(map.get("outputs"));
			if (inputs.size() == 8 && outputs.size() == 4) result.add(new Observation(inputs, outputs));
		}
		return result;
	}

	private static List<Boolean> booleans(Object value) {
		if (!(value instanceof List<?> list) || list.stream().anyMatch(item -> !(item instanceof Boolean))) return List.of();
		return list.stream().map(Boolean.class::cast).toList();
	}

	private record Observation(List<Boolean> inputs, List<Boolean> outputs) {}
}
