package ktanesolver.module.modded.regular.drdoctor;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.drdoctor.DrDoctorInput.Disease;
import ktanesolver.module.modded.regular.drdoctor.DrDoctorInput.Symptom;

class DrDoctorSolverTest {
	private final DrDoctorSolver solver = new DrDoctorSolver();

	@Test
	void solvesDiagnosisDoseFollowUpAndPersistsSouvenirFacts() {
		ModuleEntity doctor = module(ModuleType.DR_DOCTOR, false);
		BombEntity bomb = bomb("ABC129", 0, 0, Map.of(), List.of(doctor, module(ModuleType.MURDER, true), module(ModuleType.BUTTON, false)));
		DrDoctorInput input = new DrDoctorInput(
			List.of(Disease.ALZTIMERS, Disease.BRAINTENANCE, Disease.COLOR_ALLERGY),
			List.of(Symptom.FEVER, Symptom.CHILLS, Symptom.DIZZINESS, Symptom.COUGH, Symptom.GAS, Symptom.NAUSEA, Symptom.SLEEPINESS),
			false,
			Symptom.CHILLS
		);

		DrDoctorOutput output = solve(bomb, doctor, input);

		assertThat(output).isEqualTo(new DrDoctorOutput("Alztimer’s", "Minecraftazol", "2mg", 12, 4));
		assertThat(doctor.getState()).containsEntry("displayedSymptom", "Chills");
		assertThat(doctor.getState().get("listedDiseases")).isEqualTo(List.of("Alztimer’s", "Braintenance", "Color allergy"));
		assertThat(doctor.getState().get("listedSymptoms")).isEqualTo(List.of("Fever", "Chills", "Dizziness", "Cough", "Gas", "Nausea", "Sleepiness"));
	}

	@Test
	void honorsReverseDiagnosisSuperbugAndDoseBranches() {
		ModuleEntity doctor = module(ModuleType.DR_DOCTOR, false);
		BombEntity iPhoneBomb = bomb("A1B2C2", 0, 0, Map.of(), List.of(doctor, module(ModuleType.THE_IPHONE, false), module(ModuleType.MURDER, true)));
		DrDoctorInput noFever = new DrDoctorInput(
			List.of(Disease.ZOOTIES, Disease.YES_NO_INFECTION, Disease.XMAS),
			List.of(Symptom.MUSCLE_CRAMP, Symptom.CONSTIPATION, Symptom.SLEEPINESS, Symptom.GAS, Symptom.THROAT_IRRITATION, Symptom.DIARRHEA, Symptom.FOOT_SWELLING),
			false,
			Symptom.GAS
		);
		assertThat(solve(iPhoneBomb, doctor, noFever))
			.isEqualTo(new DrDoctorOutput("Zooties", "CS-Go Lotion", "2mg", 12, 4));

		ModuleEntity superbugDoctor = module(ModuleType.DR_DOCTOR, false);
		BombEntity superbug = bomb("ABC129", 0, 3, Map.of("FRK", true, "TRN", false),
			List.of(superbugDoctor, module(ModuleType.FORGET_ME_NOT, false), module(ModuleType.MURDER, true)));
		DrDoctorInput superbugInput = new DrDoctorInput(
			List.of(Disease.EMOJILEPSY, Disease.FOOT_AND_MORSE, Disease.GOUT_OF_LIFE),
			List.of(Symptom.HEADACHE, Symptom.MUSCLE_CRAMP, Symptom.NAUSEA, Symptom.THROAT_IRRITATION, Symptom.CONSTIPATION, Symptom.FOOT_SWELLING, Symptom.HALLUCINATION),
			false,
			Symptom.NAUSEA
		);
		assertThat(solve(superbug, superbugDoctor, superbugInput))
			.isEqualTo(new DrDoctorOutput("Emojilepsy", "Cyanide", "420g", 12, 4));

		ModuleEntity frqDoctor = module(ModuleType.DR_DOCTOR, false);
		BombEntity frq = bomb("ABC123", 0, 0, Map.of("FRQ", true),
			List.of(frqDoctor, module(ModuleType.MURDER, true), module(ModuleType.BUTTON, false)));
		DrDoctorInput frqInput = new DrDoctorInput(
			List.of(Disease.DETONESSION, Disease.EMOJILEPSY, Disease.FOOT_AND_MORSE),
			List.of(Symptom.DIZZINESS, Symptom.FATIGUE, Symptom.FEVER, Symptom.HEADACHE, Symptom.MUSCLE_CRAMP, Symptom.NAUSEA, Symptom.CONSTIPATION),
			false,
			Symptom.FATIGUE
		);
		frq.replacePortPlates(List.of(Set.of(PortType.DVI), Set.of(PortType.SERIAL)));
		assertThat(solve(frq, frqDoctor, frqInput).dose()).isEqualTo("2g");
	}

	@SuppressWarnings("unchecked")
	private DrDoctorOutput solve(BombEntity bomb, ModuleEntity module, DrDoctorInput input) {
		RoundEntity round = new RoundEntity();
		round.setStartTime(Instant.parse("2026-04-08T12:00:00Z"));
		return ((SolveSuccess<DrDoctorOutput>) solver.solve(round, bomb, module, input)).output();
	}

	private static BombEntity bomb(
		String serial, int aa, int d, Map<String, Boolean> indicators, List<ModuleEntity> modules
	) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setIndicators(new HashMap<>(indicators));
		bomb.setModules(modules);
		modules.forEach(module -> module.setBomb(bomb));
		return bomb;
	}

	private static ModuleEntity module(ModuleType type, boolean solved) {
		ModuleEntity module = new ModuleEntity();
		module.setType(type);
		module.setSolved(solved);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
