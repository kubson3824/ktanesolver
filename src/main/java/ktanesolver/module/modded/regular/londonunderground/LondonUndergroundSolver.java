package ktanesolver.module.modded.regular.londonunderground;

import java.util.ArrayDeque;
import java.util.ArrayList;
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
import ktanesolver.module.modded.regular.londonunderground.LondonUndergroundInput.Action;

@Service
@ModuleInfo(
	type = ModuleType.LONDON_UNDERGROUND,
	id = "londonUnderground",
	name = "The London Underground",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find a journey of no more than three Underground lines for each of three stages",
	tags = {"map", "stations", "multi-stage", "souvenir", "modded"}
)
public class LondonUndergroundSolver extends AbstractModuleSolver<LondonUndergroundInput, LondonUndergroundOutput> {
	private static final List<Line> LINES = List.of(
		line("Bakerloo", "Stonebridge Park|Harlesden|Willesden Junction|Kensal Green|Queen's Park|Kilburn Park|Maida Vale|Warwick Avenue|Paddington|Edgware Road|Marylebone|Baker Street|Regent's Park|Oxford Circus|Piccadilly Circus|Charing Cross|Embankment|Waterloo|Lambeth North|Elephant & Castle"),
		line("Central", "Hanger Lane|Ealing Broadway|West Acton|North Acton|East Acton|White City/Wood Lane|Shepherd's Bush|Holland Park|Notting Hill Gate|Queensway|Lancaster Gate|Marble Arch|Bond Street|Oxford Circus|Tottenham Court Road|Holborn|Chancery Lane|St. Paul's|Monument/Bank|Liverpool Street|Bethnal Green|Mile End|Stratford|Leyton|Leytonstone"),
		line("Circle", "Hammersmith|Goldhawk Road|Shepherd's Bush Market|White City/Wood Lane|Latimer Road|Ladbroke Grove|Westbourne Park|Royal Oak|Paddington|Edgware Road|Bayswater|Notting Hill Gate|High Street Kensington|Gloucester Road|South Kensington|Sloane Square|Victoria|St. James's Park|Westminster|Embankment|Temple|Blackfriars|Mansion House|Cannon Street|Monument/Bank|Tower Hill|Aldgate|Liverpool Street|Moorgate|Barbican|Farringdon|King's Cross St. Pancras|Euston Square|Great Portland Street|Baker Street"),
		line("District", "Ealing Broadway|Ealing Common|Acton Town|Chiswick Park|Turnham Green|Stamford Brook|Ravenscourt Park|Hammersmith|Barons Court|West Kensington|Earl's Court|Gloucester Road|South Kensington|Sloane Square|Victoria|St. James's Park|Westminster|Embankment|Temple|Blackfriars|Mansion House|Cannon Street|Monument/Bank|Tower Hill|Aldgate East|Whitechapel|Stepney Green|Mile End|Bow Road|Bromley-by-Bow|West Ham|Plaistow|Upton Park|East Ham|High Street Kensington|Notting Hill Gate|Bayswater|Paddington|Edgware Road"),
		line("Hammersmith & City", "Hammersmith|Goldhawk Road|Shepherd's Bush Market|White City/Wood Lane|Latimer Road|Ladbroke Grove|Westbourne Park|Royal Oak|Paddington|Edgware Road|Baker Street|Great Portland Street|Euston Square|King's Cross St. Pancras|Farringdon|Barbican|Moorgate|Liverpool Street|Aldgate East|Whitechapel|Stepney Green|Mile End|Bow Road|Bromley-by-Bow|West Ham|Plaistow|Upton Park|East Ham"),
		line("Jubilee", "Neasden|Dollis Hill|Willesden Green|Kilburn|West Hampstead|Finchley Road|Swiss Cottage|St. John's Wood|Baker Street|Bond Street|Green Park|Westminster|Waterloo|Southwark|London Bridge|Bermondsey|Canada Water|Canary Wharf|North Greenwich|Canning Town|West Ham|Stratford"),
		line("Metropolitan", "Finchley Road|Baker Street|Great Portland Street|Euston Square|King's Cross St. Pancras|Farringdon|Barbican|Moorgate|Liverpool Street|Aldgate"),
		line("Northern", "Clapham South|Clapham Common|Clapham North|Stockwell|Oval|Kennington|Waterloo|Embankment|Charing Cross|Leicester Square|Tottenham Court Road|Goodge Street|Warren Street|Euston|Mornington Crescent|Camden Town|Chalk Farm|Belsize Park|Hampstead|Golders Green|Brent Cross|Hendon Central|Elephant & Castle|Borough|London Bridge|Monument/Bank|Moorgate|Old Street|Angel|King's Cross St. Pancras|Kentish Town|Tufnell Park|Archway|Highgate|East Finchley"),
		line("Piccadilly", "Northfields|South Ealing|Acton Town|Turnham Green|Hammersmith|Barons Court|Earl's Court|Gloucester Road|South Kensington|Knightsbridge|Hyde Park Corner|Green Park|Piccadilly Circus|Leicester Square|Covent Garden|Holborn|Russell Square|King's Cross St. Pancras|Caledonian Road|Holloway Road|Arsenal|Finsbury Park|Manor House|Turnpike Lane|Wood Green|Bounds Green|Ealing Common|North Ealing|Park Royal"),
		line("Victoria", "Brixton|Stockwell|Vauxhall|Pimlico|Victoria|Green Park|Oxford Circus|Warren Street|Euston|King's Cross St. Pancras|Highbury & Islington|Finsbury Park|Seven Sisters|Tottenham Hale|Blackhorse Road|Walthamstow Central")
	);

	@Override
	protected SolveResult<LondonUndergroundOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LondonUndergroundInput input
	) {
		if (input == null || input.action() == null) return failure("Choose a London Underground action");
		if (input.action() == Action.RESET) {
			module.getState().keySet().removeAll(List.of("stage", "departures", "destinations", "lastDestination"));
			return success(new LondonUndergroundOutput(List.of(), 0), false);
		}

		String departure = canonicalStation(input.departure());
		String destination = canonicalStation(input.destination());
		if (departure == null) return failure("Enter a departure station shown on the module");
		if (destination == null) return failure("Enter a destination station shown on the module");
		if (departure.equals(destination)) return failure("Departure and destination must be different");

		int previousStage = ((Number) module.getState().getOrDefault("stage", 0)).intValue();
		if (previousStage >= 3) return failure("All three journeys have already been solved");
		Object lastDestination = module.getState().get("lastDestination");
		if (previousStage > 0 && !departure.equals(lastDestination)) {
			return failure("This journey must depart from the previous destination, " + lastDestination);
		}

		List<LondonUndergroundLeg> journey = findJourney(departure, destination);
		if (journey.isEmpty()) return failure("No journey of three or fewer lines connects those stations");

		List<String> departures = strings(module.getState().get("departures"));
		List<String> destinations = strings(module.getState().get("destinations"));
		departures.add(departure);
		destinations.add(destination);
		int stage = previousStage + 1;
		storeState(module, Map.of(
			"stage", stage,
			"departures", departures,
			"destinations", destinations,
			"lastDestination", destination
		));
		return success(new LondonUndergroundOutput(journey, stage), stage == 3);
	}

	private static List<LondonUndergroundLeg> findJourney(String departure, String destination) {
		ArrayDeque<List<Integer>> queue = new ArrayDeque<>();
		boolean[] visited = new boolean[LINES.size()];
		for (int i = 0; i < LINES.size(); i++) if (LINES.get(i).stations().contains(departure)) {
			queue.add(List.of(i));
			visited[i] = true;
		}
		while (!queue.isEmpty()) {
			List<Integer> path = queue.remove();
			Line current = LINES.get(path.getLast());
			if (current.stations().contains(destination)) return legs(path, destination);
			if (path.size() == 3) continue;
			for (int next = 0; next < LINES.size(); next++) {
				if (visited[next] || intersection(current, LINES.get(next)) == null) continue;
				visited[next] = true;
				List<Integer> extended = new ArrayList<>(path);
				extended.add(next);
				queue.add(extended);
			}
		}
		return List.of();
	}

	private static List<LondonUndergroundLeg> legs(List<Integer> path, String destination) {
		List<LondonUndergroundLeg> result = new ArrayList<>();
		for (int i = 0; i < path.size(); i++) {
			Line line = LINES.get(path.get(i));
			String station = i == path.size() - 1 ? destination : intersection(line, LINES.get(path.get(i + 1)));
			result.add(new LondonUndergroundLeg(line.name(), station));
		}
		return result;
	}

	private static String intersection(Line first, Line second) {
		return first.stations().stream().filter(second.stations()::contains).findFirst().orElse(null);
	}

	private static String canonicalStation(String value) {
		if (value == null) return null;
		String normalized = value.trim().replace('’', '\'').toLowerCase(Locale.ROOT);
		return LINES.stream().flatMap(line -> line.stations().stream())
			.filter(station -> station.toLowerCase(Locale.ROOT).equals(normalized))
			.findFirst().orElse(null);
	}

	private static List<String> strings(Object value) {
		return value instanceof List<?> list ? new ArrayList<>(list.stream().map(String::valueOf).toList()) : new ArrayList<>();
	}

	private static Line line(String name, String stations) {
		return new Line(name, List.of(stations.split("\\|")));
	}

	private record Line(String name, List<String> stations) {}
}
