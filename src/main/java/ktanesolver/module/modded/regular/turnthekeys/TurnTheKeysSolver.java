package ktanesolver.module.modded.regular.turnthekeys;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.type.TypeReference;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.utils.Json;

@Service
@ModuleInfo(type = ModuleType.TURN_THE_KEYS, id = "turnthekeys", name = "Turn The Keys", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Two keys and a priority display; turn each key in the correct order relative to other modules and other Turn The Keys.", tags = {
	"order", "keys" })
public class TurnTheKeysSolver extends AbstractModuleSolver<TurnTheKeysInput, TurnTheKeysOutput> {

	private static final Set<ModuleType> RIGHT_AFTER_SOLVED = EnumSet.of(
		ModuleType.MORSE_CODE, ModuleType.WIRES, ModuleType.TWO_BITS, ModuleType.BUTTON,
		ModuleType.COLOR_FLASH, ModuleType.ROUND_KEYPAD);
	private static final Set<ModuleType> RIGHT_BEFORE_SOLVED = EnumSet.of(
		ModuleType.SEMAPHORE, ModuleType.COMBINATION_LOCK, ModuleType.SIMON_SAYS,
		ModuleType.ASTROLOGY, ModuleType.SWITCHES, ModuleType.PLUMBING);
	private static final Set<ModuleType> LEFT_AFTER_SOLVED = EnumSet.of(
		ModuleType.PASSWORDS, ModuleType.WHOS_ON_FIRST, ModuleType.CRAZY_TALK, ModuleType.KEYPADS,
		ModuleType.LISTENING, ModuleType.ORIENTATION_CUBE);
	private static final Set<ModuleType> LEFT_BEFORE_SOLVED = EnumSet.of(
		ModuleType.MAZES, ModuleType.MEMORY, ModuleType.COMPLICATED_WIRES, ModuleType.WIRE_SEQUENCES,
		ModuleType.CRYPTOGRAPHY);

	@Override
	public SolveResult<TurnTheKeysOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TurnTheKeysInput input) {
		int priority = input.priority();
		if (priority < 0) {
			return failure("Priority must be 0 or greater");
		}

		// Persist input into current module state
		storeState(module, "priority", priority);
		if (input.rightKeyTurned() != null) {
			storeState(module, "rightKeyTurned", input.rightKeyTurned());
		}
		if (input.leftKeyTurned() != null) {
			storeState(module, "leftKeyTurned", input.leftKeyTurned());
		}

		TurnTheKeysOutput output = computeOutput(bomb, module);
		return success(output);
	}

	/**
	 * Recomputes Turn The Keys output from current bomb and module state without persisting any state.
	 * Used by the event listener to refresh solution when other modules are solved or strike is added.
	 */
	public void refreshSolution(RoundEntity round, BombEntity bomb, ModuleEntity module) {
		int currentPriority = getPriority(module);
		if (currentPriority < 0) {
			return;
		}
		TurnTheKeysOutput output = computeOutput(bomb, module);
		Map<String, Object> converted = Json.mapper().convertValue(output, new TypeReference<>() {});
		module.getSolution().putAll(converted);
	}

	/**
	 * Computes the Turn The Keys output from current bomb and module state (reads priority and key state from module only).
	 */
	private TurnTheKeysOutput computeOutput(BombEntity bomb, ModuleEntity module) {
		int currentPriority = getPriority(module);

		// Collect all Turn The Keys on this bomb with priority and key state
		List<TurnTheKeysState> otherKeys = new ArrayList<>();
		for (ModuleEntity m : bomb.getModules()) {
			if (m.getType() != ModuleType.TURN_THE_KEYS) continue;
			int p = getPriority(m);
			boolean rightTurned = getBooleanState(m, "rightKeyTurned");
			boolean leftTurned = getBooleanState(m, "leftKeyTurned");
			otherKeys.add(new TurnTheKeysState(m.getId().equals(module.getId()), p, rightTurned, leftTurned));
		}

		// Count by type: how many of each type on bomb, how many solved
		Map<ModuleType, Long> onBomb = countByType(bomb, false);
		Map<ModuleType, Long> solved = countByType(bomb, true);

		boolean canTurnRight = canTurnRightKey(currentPriority, otherKeys, onBomb, solved);
		boolean canTurnLeft = canTurnLeftKey(currentPriority, otherKeys, onBomb, solved);

		String rightInstr = buildRightKeyInstruction(currentPriority, otherKeys, onBomb, solved, canTurnRight);
		String leftInstr = buildLeftKeyInstruction(currentPriority, otherKeys, onBomb, solved, canTurnLeft);

		boolean rightKeyTurned = getBooleanState(module, "rightKeyTurned");
		boolean leftKeyTurned = getBooleanState(module, "leftKeyTurned");
		return new TurnTheKeysOutput(leftInstr, rightInstr, currentPriority, canTurnRight, canTurnLeft, rightKeyTurned, leftKeyTurned);
	}

	private static int getPriority(ModuleEntity m) {
		Object fromSol = m.getSolution() != null ? m.getSolution().get("priority") : null;
		if (fromSol instanceof Number n) return n.intValue();
		Object fromState = m.getState() != null ? m.getState().get("priority") : null;
		if (fromState instanceof Number n) return n.intValue();
		return -1;
	}

	private static boolean getBooleanState(ModuleEntity m, String key) {
		if (m.getState() == null) return false;
		Object v = m.getState().get(key);
		if (v instanceof Boolean b) return b;
		if (v instanceof String s) return Boolean.parseBoolean(s);
		return false;
	}

	private static Map<ModuleType, Long> countByType(BombEntity bomb, boolean solvedOnly) {
		return bomb.getModules().stream()
			.filter(m -> !solvedOnly || m.isSolved())
			.filter(m -> m.getType() != null)
			.collect(java.util.stream.Collectors.groupingBy(ModuleEntity::getType, java.util.stream.Collectors.counting()));
	}

	private boolean canTurnRightKey(int currentPriority, List<TurnTheKeysState> allKeys,
		Map<ModuleType, Long> onBomb, Map<ModuleType, Long> solved) {
		// Before: no left key turned on any Turn The Keys
		if (allKeys.stream().anyMatch(k -> k.leftKeyTurned)) return false;
		// Before: no lower-priority right key turned
		if (allKeys.stream().anyMatch(k -> !k.isCurrent && k.priority < currentPriority && k.rightKeyTurned)) return false;
		// Before: none of RIGHT_BEFORE_SOLVED solved
		for (ModuleType t : RIGHT_BEFORE_SOLVED) {
			if (solved.getOrDefault(t, 0L) > 0) return false;
		}
		// After: all higher-priority right keys turned
		if (allKeys.stream().anyMatch(k -> k.priority > currentPriority && !k.rightKeyTurned)) return false;
		// After: every RIGHT_AFTER_SOLVED that exists on bomb is solved
		for (ModuleType t : RIGHT_AFTER_SOLVED) {
			long need = onBomb.getOrDefault(t, 0L);
			long have = solved.getOrDefault(t, 0L);
			if (need > 0 && have < need) return false;
		}
		return true;
	}

	private boolean canTurnLeftKey(int currentPriority, List<TurnTheKeysState> allKeys,
		Map<ModuleType, Long> onBomb, Map<ModuleType, Long> solved) {
		// After: all right keys on Turn The Keys turned (including this one)
		if (allKeys.stream().anyMatch(k -> !k.rightKeyTurned)) return false;
		// After: all lower-priority left keys turned
		if (allKeys.stream().anyMatch(k -> !k.isCurrent && k.priority < currentPriority && !k.leftKeyTurned)) return false;
		// After: every LEFT_AFTER_SOLVED that exists on bomb is solved
		for (ModuleType t : LEFT_AFTER_SOLVED) {
			long need = onBomb.getOrDefault(t, 0L);
			long have = solved.getOrDefault(t, 0L);
			if (need > 0 && have < need) return false;
		}
		// Before: no higher-priority left key turned
		if (allKeys.stream().anyMatch(k -> k.priority > currentPriority && k.leftKeyTurned)) return false;
		// Before: none of LEFT_BEFORE_SOLVED solved
		for (ModuleType t : LEFT_BEFORE_SOLVED) {
			if (solved.getOrDefault(t, 0L) > 0) return false;
		}
		return true;
	}

	private String buildRightKeyInstruction(int currentPriority, List<TurnTheKeysState> allKeys,
		Map<ModuleType, Long> onBomb, Map<ModuleType, Long> solved, boolean canTurn) {
		if (canTurn) return "You can turn the right key now.";
		List<String> after = new ArrayList<>();
		// Higher-priority right keys
		List<TurnTheKeysState> higherRight = allKeys.stream()
			.filter(k -> k.priority > currentPriority && !k.rightKeyTurned).toList();
		if (!higherRight.isEmpty()) {
			after.add("turn all higher-priority right keys first (priorities " +
				higherRight.stream().map(k -> k.priority).sorted().map(String::valueOf).collect(Collectors.joining(", ")) + ")");
		}
		for (ModuleType t : RIGHT_AFTER_SOLVED) {
			long need = onBomb.getOrDefault(t, 0L);
			long have = solved.getOrDefault(t, 0L);
			if (need > 0 && have < need) {
				after.add("solve all " + formatType(t) + " (" + have + "/" + need + " solved)");
			}
		}
		List<String> before = new ArrayList<>();
		if (allKeys.stream().anyMatch(k -> k.leftKeyTurned)) {
			before.add("do not turn any left keys before the right key");
		}
		for (ModuleType t : RIGHT_BEFORE_SOLVED) {
			if (solved.getOrDefault(t, 0L) > 0) {
				before.add("do not solve " + formatType(t) + " before turning the right key");
			}
		}
		StringBuilder sb = new StringBuilder("Right key: Turn after ");
		sb.append(after.isEmpty() ? "nothing else." : String.join("; ", after));
		if (!before.isEmpty()) {
			sb.append(" Before: ").append(String.join("; ", before));
		}
		return sb.toString();
	}

	private String buildLeftKeyInstruction(int currentPriority, List<TurnTheKeysState> allKeys,
		Map<ModuleType, Long> onBomb, Map<ModuleType, Long> solved, boolean canTurn) {
		if (canTurn) return "You can turn the left key now.";
		List<String> after = new ArrayList<>();
		if (allKeys.stream().anyMatch(k -> !k.rightKeyTurned)) {
			after.add("turn the right key on all Turn The Keys modules first");
		}
		List<TurnTheKeysState> lowerLeft = allKeys.stream()
			.filter(k -> !k.isCurrent && k.priority < currentPriority && !k.leftKeyTurned).toList();
		if (!lowerLeft.isEmpty()) {
			after.add("turn all lower-priority left keys first (priorities " +
				lowerLeft.stream().map(k -> k.priority).sorted().map(String::valueOf).collect(Collectors.joining(", ")) + ")");
		}
		for (ModuleType t : LEFT_AFTER_SOLVED) {
			long need = onBomb.getOrDefault(t, 0L);
			long have = solved.getOrDefault(t, 0L);
			if (need > 0 && have < need) {
				after.add("solve all " + formatType(t) + " (" + have + "/" + need + " solved)");
			}
		}
		List<String> before = new ArrayList<>();
		for (ModuleType t : LEFT_BEFORE_SOLVED) {
			if (solved.getOrDefault(t, 0L) > 0) {
				before.add("do not solve " + formatType(t) + " before turning the left key");
			}
		}
		if (allKeys.stream().anyMatch(k -> k.priority > currentPriority && k.leftKeyTurned)) {
			before.add("turn this left key before any higher-priority left key");
		}
		StringBuilder sb = new StringBuilder("Left key: Turn after ");
		sb.append(after.isEmpty() ? "nothing else." : String.join("; ", after));
		if (!before.isEmpty()) {
			sb.append(" Before: ").append(String.join("; ", before));
		}
		return sb.toString();
	}

	private static String formatType(ModuleType t) {
		return t.name().replace("_", " ").toLowerCase();
	}

	private record TurnTheKeysState(boolean isCurrent, int priority, boolean rightKeyTurned, boolean leftKeyTurned) {}
}
