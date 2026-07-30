package ktanesolver.module.modded.regular.drdoctor;

import java.util.List;
import java.util.Set;

import ktanesolver.logic.ModuleInput;

public record DrDoctorInput(
	List<Disease> diagnoses,
	List<Symptom> symptoms,
	Boolean moreThanHalfTimeRemaining,
	Symptom displayedSymptom
) implements ModuleInput {
	public enum Symptom {
		BLOATING("Bloating"),
		CHILLS("Chills"),
		COLD_HANDS("Cold Hands"),
		CONSTIPATION("Constipation"),
		COUGH("Cough"),
		DIARRHEA("Diarrhea"),
		DISAPPEARANCE_OF_THE_EARS("Disappearance of the Ears"),
		DIZZINESS("Dizziness"),
		EXCESSIVE_CRYING("Excessive Crying"),
		FATIGUE("Fatigue"),
		FEVER("Fever"),
		FOOT_SWELLING("Foot swelling"),
		GAS("Gas"),
		HALLUCINATION("Hallucination"),
		HEADACHE("Headache"),
		LOSS_OF_SMELL("Loss of Smell"),
		MUSCLE_CRAMP("Muscle Cramp"),
		NAUSEA("Nausea"),
		NUMBNESS("Numbness"),
		SHORTNESS_OF_BREATH("Shortness of Breath"),
		SLEEPINESS("Sleepiness"),
		THIRSTINESS("Thirstiness"),
		THROAT_IRRITATION("Throat irritation");

		private final String label;

		Symptom(String label) {
			this.label = label;
		}

		public String label() {
			return label;
		}
	}

	public enum Disease {
		ALZTIMERS('A', "Alztimer’s", "Minecraftazol", Symptom.FEVER, Symptom.CHILLS, Symptom.DIZZINESS),
		BRAINTENANCE('B', "Braintenance", "Gr-Theta Autazine", Symptom.HEADACHE, Symptom.SLEEPINESS, Symptom.THIRSTINESS),
		COLOR_ALLERGY('C', "Color allergy", "Tears of Tar", Symptom.BLOATING, Symptom.COUGH, Symptom.DIARRHEA),
		DETONESSION('D', "Detonession", "Residentevele", Symptom.DIZZINESS, Symptom.FATIGUE, Symptom.FEVER),
		EMOJILEPSY('E', "Emojilepsy", "Vitamin PUBG-12", Symptom.HEADACHE, Symptom.MUSCLE_CRAMP, Symptom.NAUSEA),
		FOOT_AND_MORSE('F', "Foot and Morse", "Fortinite", Symptom.THROAT_IRRITATION, Symptom.CONSTIPATION, Symptom.FOOT_SWELLING),
		GOUT_OF_LIFE('G', "Gout of Life", "Scrapmechanol", Symptom.HALLUCINATION, Symptom.COLD_HANDS, Symptom.EXCESSIVE_CRYING),
		HRV('H', "HRV", "Freddi-5", Symptom.GAS, Symptom.NUMBNESS, Symptom.LOSS_OF_SMELL),
		INDICITIS('I', "Indicitis", "Forestamine", Symptom.BLOATING, Symptom.FEVER, Symptom.HALLUCINATION),
		JAUNDRY('J', "Jaundry", "λ-3", Symptom.DISAPPEARANCE_OF_THE_EARS, Symptom.FEVER, Symptom.SHORTNESS_OF_BREATH),
		KEYPAD_STONES('K', "Keypad stones", "Crushed Candy", Symptom.HEADACHE, Symptom.SLEEPINESS, Symptom.FEVER),
		LEGOMANIA('L', "Legomania", "Supermariobromine", Symptom.COUGH, Symptom.EXCESSIVE_CRYING, Symptom.MUSCLE_CRAMP),
		MICROCONTUSION('M', "Microcontusion", "Q-Bertamin", Symptom.FEVER, Symptom.CHILLS, Symptom.DIZZINESS),
		NARCOLIZATION('N', "Narcolization", "Vitamin Wii", Symptom.NUMBNESS, Symptom.CONSTIPATION, Symptom.FATIGUE),
		OCD('O', "OCd", "Astrodrosodale", Symptom.SLEEPINESS, Symptom.DIZZINESS, Symptom.THIRSTINESS),
		PIEKINSONS('P', "Piekinson’s", "Adlez DNA Knil", Symptom.SLEEPINESS, Symptom.COLD_HANDS, Symptom.THIRSTINESS),
		QUACKGROUNDS('Q', "Quackgrounds", "Nearwhisper", Symptom.CHILLS, Symptom.LOSS_OF_SMELL, Symptom.THROAT_IRRITATION),
		ROYAL_FLU('R', "Royal Flu", "Warcraftazol", Symptom.THIRSTINESS, Symptom.FEVER, Symptom.HEADACHE),
		SEIZURE_SIPHOR('S', "Seizure Siphor", "Leega Ledgins", Symptom.CONSTIPATION, Symptom.BLOATING, Symptom.HALLUCINATION),
		TETRINUS('T', "Tetrinus", "No-Mercy", Symptom.HALLUCINATION, Symptom.COLD_HANDS, Symptom.DIZZINESS),
		URINARY_LEDS('U', "Urinary LEDs", "Assassine Cream", Symptom.CHILLS, Symptom.NAUSEA, Symptom.NUMBNESS),
		VERTICODE('V', "Verticode", "Cupcakes", Symptom.LOSS_OF_SMELL, Symptom.COLD_HANDS, Symptom.SLEEPINESS),
		WIDGETING('W', "Widgeting", "GLa-doze", Symptom.THIRSTINESS, Symptom.COUGH, Symptom.FATIGUE),
		XMAS('X', "XMAs", "Ball of Cootie", Symptom.DIARRHEA, Symptom.SLEEPINESS, Symptom.FOOT_SWELLING),
		YES_NO_INFECTION('Y', "Yes-no infection", "War-Med", Symptom.GAS, Symptom.THROAT_IRRITATION, Symptom.MUSCLE_CRAMP),
		ZOOTIES('Z', "Zooties", "CS-Go Lotion", Symptom.MUSCLE_CRAMP, Symptom.CONSTIPATION, Symptom.SLEEPINESS),
		CHRONIC_TALK('1', "Chronic Talk", "Red Ded", Symptom.THROAT_IRRITATION, Symptom.COUGH, Symptom.FOOT_SWELLING),
		JUKEPOX('2', "Jukepox", "Solid Gear Metal", Symptom.SLEEPINESS, Symptom.HEADACHE, Symptom.DIZZINESS),
		NEUROLYSIS('3', "Neurolysis", "Vitamin BEAM", Symptom.FOOT_SWELLING, Symptom.EXCESSIVE_CRYING, Symptom.NAUSEA),
		PERSPECTIVE_LOSS('4', "Perspective Loss", "Waldohol", Symptom.SLEEPINESS, Symptom.BLOATING, Symptom.DIZZINESS),
		ORIENTITIS('5', "Orientitis", "Semtex", Symptom.GAS, Symptom.NUMBNESS, Symptom.LOSS_OF_SMELL),
		HUNTINGTONS_DISEASE('6', "Huntington’s disease", "Tetrisine", Symptom.COLD_HANDS, Symptom.SLEEPINESS, Symptom.THROAT_IRRITATION);

		private final char key;
		private final String label;
		private final String treatment;
		private final Set<Symptom> symptoms;

		Disease(char key, String label, String treatment, Symptom... symptoms) {
			this.key = key;
			this.label = label;
			this.treatment = treatment;
			this.symptoms = Set.of(symptoms);
		}

		public char key() {
			return key;
		}

		public String label() {
			return label;
		}

		public String treatment() {
			return treatment;
		}

		public Set<Symptom> symptoms() {
			return symptoms;
		}
	}
}
