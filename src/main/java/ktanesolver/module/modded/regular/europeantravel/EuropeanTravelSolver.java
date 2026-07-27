package ktanesolver.module.modded.regular.europeantravel;

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
	type = ModuleType.EUROPEAN_TRAVEL,
	id = "europeanTravel",
	name = "European Travel",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Complete a European train ticket from its country and six-character ticket serial.",
	tags = {"serial", "travel", "lookup", "ticket"}
)
public class EuropeanTravelSolver extends AbstractModuleSolver<EuropeanTravelInput, EuropeanTravelOutput> {
	private static final Map<String, Integer> COUNTRY_INDEX = Map.of(
		"THE NETHERLANDS", 0,
		"UK", 1,
		"UNITED KINGDOM", 1,
		"GERMANY", 2,
		"FRANCE", 3,
		"SPAIN", 4,
		"BELGIUM", 5
	);
	private static final List<List<String>> DEPARTURES = List.of(
		List.of("Zwolle", "Groningen", "Amsterdam CS", "Utrecht CS", "Den Haag CS", "Zutphen", "Maastricht", "Schiphol A'port", "Delft", "Alkmaar", "Lelystad Zuid", "Kampen"),
		List.of("Swansea", "Coventry", "Peterborough", "Cambridge", "Stoke-on-Trent", "Watford Junction", "Exeter", "Portsmouth H'bour", "Heathrow A'port", "Luton", "Dover", "Brighton"),
		List.of("Ulm Hbf.", "Emden Hbf.", "Cottbus", "Erfurt Hbf.", "Kiel Hbf.", "Potsdam Hbf.", "Ingolstadt Hbf.", "Berlin Ost.", "Mainz Hbf.", "Frankfurt F'hafen", "Regensburg Hbf.", "Oberstdorf"),
		List.of("Clermont-Ferrand", "Bordeaux St-Jean", "Lille", "Montargis", "Grenoble", "Cannes", "Redon", "Biarritz", "Limoges", "Rouen-Rive-Droite", "Le Havre", "Dijon-Ville"),
		List.of("Santander", "Ferrol", "Plasencia", "Córdoba", "Almería", "Gandía", "Albacete", "Aranjuez", "Cádiz", "Jaca", "Vitoria", "Murcia del Carmen"),
		List.of("Antwerpen-Zuid", "Lokeren", "Tielen", "Hasselt", "Sint-Joris-Weert", "Waregem", "Oostende", "Enghien", "Lierde", "Brussel-Zuid", "Halle", "Gent-Sint-Pieters")
	);
	private static final List<List<String>> DESTINATIONS = List.of(
		List.of("Gouda", "Leiden CS", "Leeuwarden", "Middelburg", "Rotterdam CS", "Deurne", "Deventer", "Assen", "Eindhoven", "Nijmegen", "Zandvoort aan Zee", "Kerkrade Centrum"),
		List.of("Bristol Temple Meads", "Pembroke Dock", "London St. Pancras", "Aylesbury", "Chester", "Bangor", "Stourbridge Town", "Nottingham", "Manchester Victoria", "Sheffield", "Wolverhampton", "Hull"),
		List.of("Leipzig Hbf.", "Augsburg Hbf.", "Bonn Hbf.", "Leer (Ostfriesl)", "Bielefeld Hbf.", "Chemnitz Hbf.", "Karlsruhe Hbf.", "Freiburg Hbf.", "Lübeck Hbf.", "Wittenberge", "Dessau Hbf.", "Jena Paradies"),
		List.of("C. De Gaulle A'port", "St-Dizier", "Boulogne-Ville", "Paris Gare du Nord", "Poitiers", "Angers-Saint-Laud", "Nancy-Ville", "Lisieux", "Marseille St-Charles", "Toul", "Perpignan", "Nîmes"),
		List.of("Girona", "Soria", "Ourense-Empalme", "Zafra", "Málaga", "San Sebastián", "Reus", "Barcelona Sants", "Tarragona", "Guadalajara", "Madrid Atocha", "Linares-Baeza"),
		List.of("Charleroi-Sud", "Aarschot", "Mechelen", "Leuven", "Spa", "Idegem", "Tongeren", "Villers-La-Ville", "De Panne", "Knokke", "Zeebrugge-Strand", "Kortrijk")
	);
	private static final int[] SECOND_CLASS_PRICE_CENTS = {
		2399, 9554, 5311, 1083, 512, 10233, 7600, 1422, 8890, 12144, 198, 3308
	};

	@Override
	protected SolveResult<EuropeanTravelOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, EuropeanTravelInput input
	) {
		if (input == null || input.country() == null || input.ticketSerial() == null) {
			return failure("Country and ticket serial are required");
		}
		Integer country = COUNTRY_INDEX.get(input.country().trim().toUpperCase(Locale.ROOT));
		String serial = input.ticketSerial().trim().toUpperCase(Locale.ROOT);
		if (country == null) return failure("Unknown ticket country");
		if (!serial.matches("[A-NP-Z0-9]{6}")) {
			return failure("Ticket serial must contain exactly six letters or digits and cannot contain O");
		}

		boolean firstClass = Character.isLetter(serial.charAt(2));
		int priceCents = SECOND_CLASS_PRICE_CENTS[group(serial.charAt(3))] * (firstClass ? 2 : 1);
		EuropeanTravelOutput output = new EuropeanTravelOutput(
			Character.isLetter(serial.charAt(4)) ? "SGL" : "RTN",
			firstClass ? "1st class" : "2nd class",
			DEPARTURES.get(country).get(group(serial.charAt(0))),
			DESTINATIONS.get(country).get(group(serial.charAt(1))),
			seat(serial.charAt(5)),
			"%d.%02d".formatted(priceCents / 100, priceCents % 100)
		);
		storeState(module, "country", input.country().trim());
		storeState(module, "ticketSerial", serial);
		return success(output);
	}

	private static int group(char character) {
		if (character >= 'A' && character <= 'I') return (character - 'A') / 3;
		if (character >= 'J' && character <= 'L') return 3;
		if (character >= 'M' && character <= 'P') return 4;
		if (character >= 'Q' && character <= 'Y') return 5 + (character - 'Q') / 3;
		if (character == 'Z' || character <= '1') return 8;
		if (character <= '4') return 9;
		if (character <= '7') return 10;
		return 11;
	}

	private static String seat(char character) {
		if (character >= 'A' && character <= 'G') return "1A";
		if (character >= 'H' && character <= 'P') return "1B";
		if (character >= 'Q' && character <= 'T') return "2A";
		if (character >= 'U' && character <= 'Z') return "2B";
		if (character <= '2') return "3A";
		if (character <= '5') return "3B";
		if (character <= '8') return "4A";
		return "4B";
	}
}
