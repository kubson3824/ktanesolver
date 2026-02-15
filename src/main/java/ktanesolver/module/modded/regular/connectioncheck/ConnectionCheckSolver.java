
package ktanesolver.module.modded.regular.connectioncheck;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@ModuleInfo (type = ModuleType.CONNECTION_CHECK, id = "connectioncheck", name = "Connection Check", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Determine connections between number pairs using graph charts based on serial number.", tags = {
	"4-leds", "number-pairs", "graph-lookup", "serial-dependent"})
public class ConnectionCheckSolver extends AbstractModuleSolver<ConnectionCheckInput, ConnectionCheckOutput> {

	// Store connections as adjacency sets for each of the 8 nodes
	private static final Map<String, List<Set<Integer>>> CHARTS = Map.of(
		"SLIM", List.of(
			Set.of(2, 3, 6), // Node 1 connects to 2, 3, 4
			Set.of(1, 6), // Node 2 connects to 1, 3, 4
			Set.of(1, 6, 4), // Node 3 connects to 1, 2, 4
			Set.of(3, 6, 5, 7, 8), // Node 4 connects to 1, 2, 3
			Set.of(4, 6, 7), // Node 5 has no connections
			Set.of(1, 2, 3, 4, 5), // Node 6 has no connections
			Set.of(4, 5, 8), // Node 7 has no connections
			Set.of(4, 7) // Node 8 has no connections
		), "34XYZ", List.of(
			Set.of(2, 4, 6), // Node 1
			Set.of(1, 4, 3), // Node 2
			Set.of(2), // Node 3
			Set.of(1, 2, 7), // Node 4
			Set.of(6), // Node 5
			Set.of(5, 7, 8, 1), // Node 6
			Set.of(6, 8, 4), // Node 7
			Set.of(6, 7) // Node 8
		), "20DGT", List.of(
			Set.of(2, 3), // Node 1
			Set.of(1, 7, 4), // Node 2
			Set.of(1, 5, 7), // Node 3
			Set.of(2, 6, 8, 7), // Node 4
			Set.of(3, 6, 7), // Node 5
			Set.of(5, 4, 8), // Node 6
			Set.of(3, 4, 5, 2), // Node 7
			Set.of(4, 6) // Node 8
		), "15BRO", List.of(
			Set.of(2, 7), // Node 1
			Set.of(1, 7), // Node 2
			Set.of(4, 8), // Node 3
			Set.of(3, 8), // Node 4
			Set.of(7, 6), // Node 5
			Set.of(5, 7), // Node 6
			Set.of(1, 2, 6, 5), // Node 7
			Set.of(3, 4) // Node 8
		), "7HPJ", List.of(
			Set.of(2, 3), // Node 1
			Set.of(1, 3), // Node 2
			Set.of(1, 2), // Node 3
			Set.of(6, 7), // Node 4
			Set.of(6, 7), // Node 5
			Set.of(4, 5), // Node 6
			Set.of(4, 5), // Node 7
			Set.of() // Node 8
		), "6WUF", List.of(
			Set.of(2, 6, 7), // Node 1
			Set.of(1, 7, 8, 3), // Node 2
			Set.of(5, 6, 2, 8), // Node 3
			Set.of(5, 7, 8), // Node 4
			Set.of(3, 4, 6, 7), // Node 5
			Set.of(1, 7, 3, 5), // Node 6
			Set.of(5, 2, 6, 8, 4, 1), // Node 7
			Set.of(4, 7, 2, 3) // Node 8
		), "8CAKE", List.of(
			Set.of(2, 3, 6, 8), // Node 1
			Set.of(1, 4, 6), // Node 2
			Set.of(1, 8, 7, 6, 4), // Node 3
			Set.of(2, 3, 6, 7, 5), // Node 4
			Set.of(4, 7, 8), // Node 5
			Set.of(1, 2, 3, 4), // Node 6
			Set.of(3, 4, 5, 8), // Node 7
			Set.of(1, 3, 7, 5) // Node 8
		), "9QVN", List.of(
			Set.of(2, 4, 8), // Node 1
			Set.of(1, 3, 6, 7), // Node 2
			Set.of(2, 4, 6, 7), // Node 3
			Set.of(3, 5, 1), // Node 4
			Set.of(4, 6, 8), // Node 5
			Set.of(2, 3, 7, 5), // Node 6
			Set.of(8, 6, 2, 3), // Node 7
			Set.of(1, 5, 7) // Node 8
		));

	@Override
	protected SolveResult<ConnectionCheckOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ConnectionCheckInput input) {
		if(input.pairs() == null || input.pairs().size() != 4) {
			return failure("Input must contain exactly 4 number pairs");
		}

		String serial = bomb.getSerialNumber();

		// Determine which character to use based on rules
		int batteryCount = bomb.getBatteryCount();
		char targetChar = determineTargetChar(input, serial, batteryCount);

		// Find the correct chart
		List<Set<Integer>> connections = findChart(targetChar);
		if(connections == null) {
			return failure("No chart found for character: " + targetChar + ". Available chart codes: " + String.join(", ", CHARTS.keySet()));
		}

		// Check each pair and determine LED states
		boolean led1 = hasConnection(input.pairs().get(0).one(), input.pairs().get(0).two(), connections);
		boolean led2 = hasConnection(input.pairs().get(1).one(), input.pairs().get(1).two(), connections);
		boolean led3 = hasConnection(input.pairs().get(2).one(), input.pairs().get(2).two(), connections);
		boolean led4 = hasConnection(input.pairs().get(3).one(), input.pairs().get(3).two(), connections);

		storeState(module, "input", input);
		ConnectionCheckOutput output = new ConnectionCheckOutput(led1, led2, led3, led4);
		return success(output);
	}

	private char determineTargetChar(ConnectionCheckInput input, String serial, int batteryCount) {
		List<Integer> allNumbers = input.pairs().stream().flatMap(pair -> Stream.of(pair.one(), pair.two())).toList();

		// Rule 1: If all numbers are different, use the last character
		if(allNumbers.stream().distinct().count() == 8) {
			return serial.charAt(serial.length() - 1);
		}

		// Rule 2: If more than one "1", use the first character
		if(allNumbers.stream().filter(n -> n == 1).count() > 1) {
			return serial.charAt(0);
		}

		// Rule 3: If more than one "7", use the last character
		if(allNumbers.stream().filter(n -> n == 7).count() > 1) {
			return serial.charAt(serial.length() - 1);
		}

		// Rule 4: If at least three "2"s, use the second character
		if(allNumbers.stream().filter(n -> n == 2).count() >= 3) {
			return serial.charAt(1);
		}

		// Rule 5: If no "5", use the fifth character
		if( !allNumbers.contains(5)) {
			return serial.charAt(4);
		}

		// Rule 6: If exactly two "8"s, use the third character
		if(allNumbers.stream().filter(n -> n == 8).count() == 2) {
			return serial.charAt(2);
		}

		// Rule 7: If more than 6 batteries or no batteries, use the last character
		if(batteryCount > 6 || batteryCount == 0) {
			return serial.charAt(serial.length() - 1);
		}

		// Rule 8: Use battery count to determine character position
		if(batteryCount > 0 && batteryCount <= serial.length()) {
			return serial.charAt(batteryCount - 1);
		}

		// Fallback: use first character
		return serial.charAt(0);
	}

	private List<Set<Integer>> findChart(char targetChar) {
		String targetUpper = String.valueOf(targetChar).toUpperCase();

		for(Map.Entry<String, List<Set<Integer>>> entry: CHARTS.entrySet()) {
			if(entry.getKey().contains(targetUpper)) {
				return entry.getValue();
			}
		}
		return null;
	}

	private boolean hasConnection(int num1, int num2, List<Set<Integer>> connections) {
		if(num1 < 1 || num1 > 8 || num2 < 1 || num2 > 8) {
			return false;
		}

		// Check if node1 is connected to node2 (0-indexed for array access)
		return connections.get(num1 - 1).contains(num2);
	}
}
