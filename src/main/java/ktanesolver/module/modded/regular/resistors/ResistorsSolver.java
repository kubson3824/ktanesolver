package ktanesolver.module.modded.regular.resistors;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

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
	type = ModuleType.RESISTORS,
	id = "resistors",
	name = "Resistors",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the target resistance from the serial number and batteries, then wire the pins through the resistor paths that match within 5%.",
	tags = {"modded", "resistors", "electronics", "wiring"}
)
public class ResistorsSolver extends AbstractModuleSolver<ResistorsInput, ResistorsOutput> {

	private static final DecimalFormat RESISTANCE_FORMAT = new DecimalFormat("0.##");

	@Override
	protected SolveResult<ResistorsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ResistorsInput input) {
		if(bomb.getSerialNumber() == null) {
			return failure("Serial number is required for Resistors");
		}
		if(input == null || input.topResistor() == null || input.bottomResistor() == null) {
			return failure("Resistors requires both the top and bottom resistor bands");
		}

		double topResistance;
		double bottomResistance;
		try {
			topResistance = decodeResistance(input.topResistor(), "top resistor");
			bottomResistance = decodeResistance(input.bottomResistor(), "bottom resistor");
		}
		catch(IllegalArgumentException exception) {
			return failure(exception.getMessage());
		}

		storeState(module, "input", input);

		long targetResistance = determineTargetResistance(bomb);
		List<PathCandidate> candidates = buildCandidates(topResistance, bottomResistance);
		PathCandidate primaryCandidate = selectBestCandidate(targetResistance, candidates);
		if(primaryCandidate == null) {
			String availablePaths = candidates.stream()
				.map(candidate -> candidate.path().displayName() + " = " + formatResistance(candidate.resistanceOhms()) + "Ω")
				.collect(Collectors.joining(", "));
			return failure("No path produces " + targetResistance + "Ω within 5% tolerance. Available path resistances: " + availablePaths);
		}

		ResistorsPin primaryInput = determinePrimaryInput(bomb);
		ResistorsPin primaryOutput = determinePrimaryOutput(bomb);
		ResistorsPin secondaryInput = primaryInput == ResistorsPin.A ? ResistorsPin.B : ResistorsPin.A;
		ResistorsPin secondaryOutput = primaryOutput == ResistorsPin.C ? ResistorsPin.D : ResistorsPin.C;

		List<ResistorsConnection> requiredConnections = new ArrayList<>();
		requiredConnections.add(new ResistorsConnection(primaryInput, primaryOutput, primaryCandidate.path(), primaryCandidate.resistanceOhms()));

		boolean hasLitFrk = bomb.isIndicatorLit("FRK");
		if(hasLitFrk) {
			requiredConnections.add(new ResistorsConnection(primaryInput, secondaryOutput, primaryCandidate.path(), primaryCandidate.resistanceOhms()));
		}
		else if(bomb.getDBatteryCount() > 0) {
			requiredConnections.add(new ResistorsConnection(secondaryInput, secondaryOutput, ResistorsPath.DIRECT, 0.0));
		}

		ResistorsOutput output = new ResistorsOutput(
			primaryInput,
			primaryOutput,
			hasLitFrk ? null : secondaryInput,
			secondaryOutput,
			targetResistance,
			topResistance,
			bottomResistance,
			List.copyOf(requiredConnections),
			buildInstruction(requiredConnections, targetResistance)
		);
		return success(output);
	}

	private static double decodeResistance(ResistorsBands bands, String resistorLabel) {
		if(bands.firstBand() == null || bands.secondBand() == null || bands.multiplierBand() == null) {
			throw new IllegalArgumentException("All three color bands are required for the " + resistorLabel);
		}

		int tens = bands.firstBand().digitOrThrow("first band");
		int ones = bands.secondBand().digitOrThrow("second band");
		double multiplier = bands.multiplierBand().multiplierOrThrow();
		return (tens * 10 + ones) * multiplier;
	}

	private static long determineTargetResistance(BombEntity bomb) {
		String digits = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().chars()
			.filter(Character::isDigit)
			.mapToObj(c -> String.valueOf((char)c))
			.collect(Collectors.joining());

		long serialValue = digits.isEmpty() ? 0 : Long.parseLong(digits.substring(0, Math.min(2, digits.length())));
		int cappedBatteryCount = Math.min(bomb.getBatteryCount(), 6);
		for(int i = 0; i < cappedBatteryCount; i++) {
			serialValue *= 10;
		}
		return serialValue;
	}

	private static ResistorsPin determinePrimaryInput(BombEntity bomb) {
		String digits = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().replaceAll("\\D", "");
		int firstDigit = digits.isEmpty() ? 0 : digits.charAt(0) - '0';
		return firstDigit % 2 == 0 ? ResistorsPin.A : ResistorsPin.B;
	}

	private static ResistorsPin determinePrimaryOutput(BombEntity bomb) {
		return bomb.isLastDigitEven() ? ResistorsPin.C : ResistorsPin.D;
	}

	private static List<PathCandidate> buildCandidates(double topResistance, double bottomResistance) {
		double parallelResistance = topResistance + bottomResistance == 0.0 ? 0.0 : (topResistance * bottomResistance) / (topResistance + bottomResistance);
		return List.of(
			new PathCandidate(ResistorsPath.DIRECT, 0.0),
			new PathCandidate(ResistorsPath.TOP, topResistance),
			new PathCandidate(ResistorsPath.BOTTOM, bottomResistance),
			new PathCandidate(ResistorsPath.SERIES, topResistance + bottomResistance),
			new PathCandidate(ResistorsPath.PARALLEL, parallelResistance)
		);
	}

	private static PathCandidate selectBestCandidate(long targetResistance, List<PathCandidate> candidates) {
		return candidates.stream()
			.filter(candidate -> isWithinTolerance(candidate.resistanceOhms(), targetResistance))
			.min(Comparator
				.comparingDouble((PathCandidate candidate) -> relativeError(candidate.resistanceOhms(), targetResistance))
				.thenComparingInt(candidate -> pathPriority(candidate.path())))
			.orElse(null);
	}

	private static boolean isWithinTolerance(double actualResistance, long targetResistance) {
		if(targetResistance == 0) {
			return Double.compare(actualResistance, 0.0) == 0;
		}
		double tolerance = targetResistance * 0.05;
		return Math.abs(actualResistance - targetResistance) <= tolerance;
	}

	private static double relativeError(double actualResistance, long targetResistance) {
		if(targetResistance == 0) {
			return Math.abs(actualResistance);
		}
		return Math.abs(actualResistance - targetResistance) / targetResistance;
	}

	private static int pathPriority(ResistorsPath path) {
		return switch(path) {
			case DIRECT -> 0;
			case TOP -> 1;
			case BOTTOM -> 2;
			case SERIES -> 3;
			case PARALLEL -> 4;
		};
	}

	private static String buildInstruction(List<ResistorsConnection> requiredConnections, long targetResistance) {
		String actionList = requiredConnections.stream()
			.map(connection -> connection.inputPin() + " to " + connection.outputPin() + " using " + connection.path().displayName().toLowerCase(Locale.ROOT) + " (" + formatResistance(connection.resistanceOhms()) + "Ω)")
			.collect(Collectors.joining("; then connect "));
		return "Target " + targetResistance + "Ω. Connect " + actionList + ".";
	}

	private static String formatResistance(double resistanceOhms) {
		synchronized(RESISTANCE_FORMAT) {
			return RESISTANCE_FORMAT.format(resistanceOhms);
		}
	}

	private record PathCandidate(ResistorsPath path, double resistanceOhms) {
	}
}
