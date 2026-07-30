package ktanesolver.module.modded.regular.drdoctor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.drdoctor.DrDoctorInput.Disease;
import ktanesolver.module.modded.regular.drdoctor.DrDoctorInput.Symptom;

@Service
@ModuleInfo(
	type = ModuleType.DR_DOCTOR,
	id = "DrDoctorModule",
	name = "Dr. Doctor",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Diagnose the bomb, prescribe treatment and dose, and schedule a follow-up.",
	tags = {"diagnosis", "edgework", "date"}
)
public class DrDoctorSolver extends AbstractModuleSolver<DrDoctorInput, DrDoctorOutput> {
	private static final String RULES = "AFDPEOMZBGLQHRW1CJKUNYX5ITV3S246";
	private static final List<MonthDay> FOLLOW_UP_DATES = List.of(
		MonthDay.of(1, 13), MonthDay.of(1, 30), MonthDay.of(2, 14),
		MonthDay.of(4, 1), MonthDay.of(4, 4), MonthDay.of(4, 12), MonthDay.of(4, 30),
		MonthDay.of(5, 11), MonthDay.of(5, 13), MonthDay.of(5, 27),
		MonthDay.of(6, 5), MonthDay.of(6, 25),
		MonthDay.of(7, 4), MonthDay.of(7, 16), MonthDay.of(7, 27), MonthDay.of(7, 28),
		MonthDay.of(8, 2), MonthDay.of(8, 20),
		MonthDay.of(9, 1), MonthDay.of(9, 2), MonthDay.of(9, 4), MonthDay.of(9, 11),
		MonthDay.of(10, 2), MonthDay.of(10, 16),
		MonthDay.of(11, 1), MonthDay.of(11, 11), MonthDay.of(11, 20),
		MonthDay.of(12, 7), MonthDay.of(12, 18)
	);

	@Override
	protected SolveResult<DrDoctorOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, DrDoctorInput input
	) {
		if(input == null) return failure("Enter the diseases and symptoms shown on the module");
		if(!hasDistinct(input.diagnoses(), 3)) return failure("Select the three diseases shown on the module");
		if(!hasDistinct(input.symptoms(), 7)) return failure("Select the seven symptoms shown on the module");
		if(input.moreThanHalfTimeRemaining() == null) return failure("Select whether more than half of the bomb time remains");
		if(input.displayedSymptom() == null || !input.symptoms().contains(input.displayedSymptom())) {
			return failure("Select the symptom currently visible on the module");
		}

		Disease diagnosis = diagnose(bomb, input);
		if(diagnosis == null) return failure("The selected diseases and symptoms do not produce a diagnosis");

		boolean superbug = isSuperbug(bomb);
		MonthDay followUp = nearestFollowUp(startDate(round));
		storeState(module, "listedDiseases", input.diagnoses().stream().map(Disease::label).toList());
		storeState(module, "listedSymptoms", input.symptoms().stream().map(Symptom::label).toList());
		storeState(module, "displayedSymptom", input.displayedSymptom().label());
		return success(new DrDoctorOutput(
			diagnosis.label(),
			superbug ? "Cyanide" : diagnosis.treatment(),
			dose(bomb, input.symptoms(), superbug),
			followUp.getDayOfMonth(),
			followUp.getMonthValue()
		));
	}

	private static boolean hasDistinct(Collection<?> values, int size) {
		return values != null && values.size() == size && values.stream().noneMatch(java.util.Objects::isNull)
			&& values.stream().distinct().count() == size;
	}

	private static Disease diagnose(BombEntity bomb, DrDoctorInput input) {
		int rule = 0;
		if(bomb.isLastDigitEven()) rule += 8;
		if(input.moreThanHalfTimeRemaining()) rule += 16;
		if(bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count()
			> bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count()) rule += 2;
		if(bomb.getBatteryCount() >= 2) rule += 4;
		if(bomb.getModules().size() % 2 == 0) rule++;

		Disease[] diseases = Disease.values();
		char key = RULES.charAt(rule);
		int start = 0;
		while(diseases[start].key() != key) start++;
		int direction = "AEIOU".indexOf(diseases[start].label().charAt(0)) >= 0 ? 1 : -1;
		for(int offset = 0; offset < diseases.length; offset++) {
			Disease candidate = diseases[Math.floorMod(start + direction * offset, diseases.length)];
			if(input.diagnoses().contains(candidate) && input.symptoms().containsAll(candidate.symptoms())) return candidate;
		}
		return null;
	}

	private static boolean isSuperbug(BombEntity bomb) {
		return bomb.getBatteryCount() == 3
			&& bomb.getBatteryHolders() == 3
			&& bomb.isIndicatorLit("FRK")
			&& bomb.isIndicatorUnlit("TRN")
			&& hasModule(bomb, ModuleType.FORGET_ME_NOT);
	}

	private static String dose(BombEntity bomb, List<Symptom> symptoms, boolean superbug) {
		if(superbug) return "420g";
		if(bomb.isIndicatorLit("FRQ")) {
			if(switch(bomb.getLastDigit()) {
				case 2, 3, 5, 7 -> true;
				default -> false;
			}) return "2g";
			int distinctPorts = (int) bomb.getPortPlates().stream().flatMap(plate -> plate.getPorts().stream()).distinct().count();
			return milligrams(distinctPorts + bomb.getModules().size());
		}
		if(symptoms.contains(Symptom.FEVER)) {
			long solved = bomb.getModules().stream().filter(candidate -> !candidate.getType().isNeedy() && candidate.isSolved()).count();
			long unsolved = bomb.getModules().stream().filter(candidate -> !candidate.getType().isNeedy()).count() - solved;
			return milligrams(Math.toIntExact(solved * unsolved));
		}
		if(hasModule(bomb, ModuleType.THE_IPHONE)) {
			int[] digits = bomb.getSerialNumber().chars().filter(Character::isDigit).map(character -> character - '0').toArray();
			return milligrams(digits[0] * digits[digits.length - 1]);
		}
		int indicatorSum = bomb.getIndicators().keySet().stream()
			.flatMapToInt(label -> label.toUpperCase(Locale.ROOT).chars())
			.filter(character -> character >= 'A' && character <= 'Z')
			.map(character -> character - 'A' + 1)
			.sum();
		return milligrams(indicatorSum);
	}

	private static boolean hasModule(BombEntity bomb, ModuleType type) {
		return bomb.getModules().stream().anyMatch(module -> module.getType() == type);
	}

	private static String milligrams(int amount) {
		if(amount == 0) return "1mg";
		return amount > 999 ? amount / 10 + "g" : amount + "mg";
	}

	private static LocalDate startDate(RoundEntity round) {
		Instant started = round == null ? null : round.getStartTime();
		return started == null ? LocalDate.now() : LocalDate.ofInstant(started, ZoneId.systemDefault());
	}

	private static MonthDay nearestFollowUp(LocalDate start) {
		return FOLLOW_UP_DATES.stream()
			.map(date -> new DateDistance(date, List.of(start.getYear() - 1, start.getYear(), start.getYear() + 1).stream()
				.mapToLong(year -> Math.abs(ChronoUnit.DAYS.between(start, date.atYear(year))))
				.min().orElseThrow()))
			.min(Comparator.comparingLong(DateDistance::distance)
				.thenComparing(DateDistance::date, Comparator.reverseOrder()))
			.orElseThrow().date();
	}

	private record DateDistance(MonthDay date, long distance) {}
}
