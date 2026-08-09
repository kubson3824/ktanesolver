package ktanesolver.module.modded.regular.usamaze;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
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

@Service
@ModuleInfo(
	type = ModuleType.USA_MAZE,
	id = "USA",
	name = "USA Maze",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find a shortest route between two states in the default USA Maze.",
	tags = {"maze", "geography", "states", "weekday"}
)
public class USAMazeSolver extends AbstractModuleSolver<USAMazeInput, USAMazeOutput> {
	private static final Map<String, String> STATES = Map.ofEntries(
		state("AK", "Alaska"), state("AL", "Alabama"), state("AR", "Arkansas"), state("AZ", "Arizona"),
		state("CA", "California"), state("CO", "Colorado"), state("CT", "Connecticut"), state("DE", "Delaware"),
		state("FL", "Florida"), state("GA", "Georgia"), state("HI", "Hawaii"), state("IA", "Iowa"),
		state("ID", "Idaho"), state("IL", "Illinois"), state("IN", "Indiana"), state("KS", "Kansas"),
		state("KY", "Kentucky"), state("LA", "Louisiana"), state("MA", "Massachusetts"), state("MD", "Maryland"),
		state("ME", "Maine"), state("MI", "Michigan"), state("MN", "Minnesota"), state("MO", "Missouri"),
		state("MS", "Mississippi"), state("MT", "Montana"), state("NC", "North Carolina"), state("ND", "North Dakota"),
		state("NE", "Nebraska"), state("NH", "New Hampshire"), state("NJ", "New Jersey"), state("NM", "New Mexico"),
		state("NV", "Nevada"), state("NY", "New York"), state("OH", "Ohio"), state("OK", "Oklahoma"),
		state("OR", "Oregon"), state("PA", "Pennsylvania"), state("RI", "Rhode Island"), state("SC", "South Carolina"),
		state("SD", "South Dakota"), state("TN", "Tennessee"), state("TX", "Texas"), state("UT", "Utah"),
		state("VA", "Virginia"), state("VT", "Vermont"), state("WA", "Washington"), state("WI", "Wisconsin"),
		state("WV", "West Virginia"), state("WY", "Wyoming")
	);
	private static final Map<String, String> LAND = Map.ofEntries(
		edge("AL-FL", "Circle"), edge("AL-MS", "Trapezoid"), edge("AR-LA", "Circle"), edge("AR-MS", "Square"),
		edge("AR-TN", "Trapezoid"), edge("AR-TX", "Triangle"), edge("AZ-NV", "Parallelogram"), edge("CA-OR", "Circle"),
		edge("CO-KS", "Diamond"), edge("CO-OK", "Parallelogram"), edge("CT-MA", "Heart"), edge("DE-MD", "Diamond"),
		edge("FL-GA", "Square"), edge("GA-SC", "Diamond"), edge("IA-IL", "Star"), edge("IA-MN", "Parallelogram"),
		edge("IA-SD", "Circle"), edge("ID-OR", "Diamond"), edge("ID-UT", "Heart"), edge("ID-WA", "Square"),
		edge("ID-WY", "Triangle"), edge("IL-IN", "Diamond"), edge("IL-MO", "Square"), edge("IL-WI", "Heart"),
		edge("IN-MI", "Trapezoid"), edge("KS-OK", "Trapezoid"), edge("KY-OH", "Triangle"), edge("KY-VA", "Trapezoid"),
		edge("MA-NY", "Trapezoid"), edge("MA-RI", "Star"), edge("MA-VT", "Triangle"), edge("MD-PA", "Square"),
		edge("ME-NH", "Diamond"), edge("MI-OH", "Parallelogram"), edge("MI-WI", "Star"), edge("MN-WI", "Triangle"),
		edge("MO-NE", "Star"), edge("MO-OK", "Heart"), edge("MO-TN", "Parallelogram"), edge("MS-TN", "Diamond"),
		edge("MT-SD", "Square"), edge("MT-WY", "Circle"), edge("NC-VA", "Circle"), edge("ND-SD", "Diamond"),
		edge("NE-SD", "Trapezoid"), edge("NH-VT", "Square"), edge("NJ-PA", "Trapezoid"), edge("NM-OK", "Square"),
		edge("NM-TX", "Circle"), edge("NV-OR", "Trapezoid"), edge("NY-PA", "Circle"), edge("OH-WV", "Heart"),
		edge("PA-WV", "Star"), edge("TN-VA", "Star"), edge("UT-WY", "Star")
	);
	private static final Map<String, String> FLIGHT_GATEWAYS = Map.of(
		"Circle", "WA", "Square", "CA", "Trapezoid", "SC", "Parallelogram", "DE",
		"Diamond", "RI", "Triangle", "ME", "Heart", "ND", "Star", "TX"
	);
	private static final List<String> DAYS = List.of("SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY");
	private static final List<String> ALASKA_FLIGHTS = List.of("Circle", "Square", "Trapezoid", "Parallelogram", "Diamond", "Triangle", "Heart");
	private static final List<String> HAWAII_FLIGHTS = List.of("Square", "Circle", "Triangle", "Diamond", "Parallelogram", "Trapezoid", "Star");

	@Override
	protected SolveResult<USAMazeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, USAMazeInput input
	) {
		if (input == null || input.currentState() == null || input.destinationState() == null || input.dayOfWeek() == null) {
			return failure("Select the current state, destination state, and weekday");
		}
		String start = input.currentState().trim().toUpperCase(Locale.ROOT);
		String destination = input.destinationState().trim().toUpperCase(Locale.ROOT);
		String day = input.dayOfWeek().trim().toUpperCase(Locale.ROOT);
		if (!STATES.containsKey(start) || !STATES.containsKey(destination)) return failure("Use two-letter US state abbreviations");
		if (start.equals(destination)) return failure("Current and destination states must differ");
		int dayIndex = DAYS.indexOf(day);
		if (dayIndex < 0) return failure("Select a weekday from Sunday through Saturday");

		USAMazeOutput output = shortestPath(start, destination, dayIndex);
		if (output == null) return failure("No route exists between those states");
		storeState(module, Map.of(
			"souvenirState", STATES.get(start),
			"input", new USAMazeInput(start, destination, day)
		));
		return success(output);
	}

	private static USAMazeOutput shortestPath(String start, String destination, int dayIndex) {
		Map<String, List<Move>> graph = new HashMap<>();
		STATES.keySet().forEach(state -> graph.put(state, new ArrayList<>()));
		LAND.forEach((border, shape) -> {
			String[] states = border.split("-");
			connect(graph, states[0], states[1], shape);
		});
		connectFlight(graph, "AK", ALASKA_FLIGHTS.get(dayIndex));
		connectFlight(graph, "HI", HAWAII_FLIGHTS.get(dayIndex));

		ArrayDeque<String> queue = new ArrayDeque<>();
		Map<String, Step> previous = new HashMap<>();
		queue.add(start);
		previous.put(start, new Step(null, null));
		while (!queue.isEmpty() && !previous.containsKey(destination)) {
			String state = queue.removeFirst();
			for (Move move : graph.get(state)) {
				if (previous.containsKey(move.state())) continue;
				previous.put(move.state(), new Step(state, move.shape()));
				queue.addLast(move.state());
			}
		}
		if (!previous.containsKey(destination)) return null;

		LinkedList<String> route = new LinkedList<>();
		LinkedList<String> presses = new LinkedList<>();
		for (String state = destination; state != null; state = previous.get(state).state()) {
			route.addFirst(state);
			String shape = previous.get(state).shape();
			if (shape != null) presses.addFirst(shape);
		}
		return new USAMazeOutput(List.copyOf(route), List.copyOf(presses));
	}

	private static void connectFlight(Map<String, List<Move>> graph, String outlying, String shape) {
		connect(graph, outlying, FLIGHT_GATEWAYS.get(shape), shape);
	}

	private static void connect(Map<String, List<Move>> graph, String first, String second, String shape) {
		graph.get(first).add(new Move(second, shape));
		graph.get(second).add(new Move(first, shape));
	}

	private static Map.Entry<String, String> state(String abbreviation, String name) { return Map.entry(abbreviation, name); }
	private static Map.Entry<String, String> edge(String states, String shape) { return Map.entry(states, shape); }
	private record Move(String state, String shape) {}
	private record Step(String state, String shape) {}
}
