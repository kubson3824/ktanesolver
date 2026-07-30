import { solveModule } from "../lib/api";

export const DR_DOCTOR_DISEASES = [
  ["ALZTIMERS", "Alztimer’s"],
  ["BRAINTENANCE", "Braintenance"],
  ["COLOR_ALLERGY", "Color allergy"],
  ["DETONESSION", "Detonession"],
  ["EMOJILEPSY", "Emojilepsy"],
  ["FOOT_AND_MORSE", "Foot and Morse"],
  ["GOUT_OF_LIFE", "Gout of Life"],
  ["HRV", "HRV"],
  ["INDICITIS", "Indicitis"],
  ["JAUNDRY", "Jaundry"],
  ["KEYPAD_STONES", "Keypad stones"],
  ["LEGOMANIA", "Legomania"],
  ["MICROCONTUSION", "Microcontusion"],
  ["NARCOLIZATION", "Narcolization"],
  ["OCD", "OCd"],
  ["PIEKINSONS", "Piekinson’s"],
  ["QUACKGROUNDS", "Quackgrounds"],
  ["ROYAL_FLU", "Royal Flu"],
  ["SEIZURE_SIPHOR", "Seizure Siphor"],
  ["TETRINUS", "Tetrinus"],
  ["URINARY_LEDS", "Urinary LEDs"],
  ["VERTICODE", "Verticode"],
  ["WIDGETING", "Widgeting"],
  ["XMAS", "XMAs"],
  ["YES_NO_INFECTION", "Yes-no infection"],
  ["ZOOTIES", "Zooties"],
  ["CHRONIC_TALK", "Chronic Talk"],
  ["JUKEPOX", "Jukepox"],
  ["NEUROLYSIS", "Neurolysis"],
  ["PERSPECTIVE_LOSS", "Perspective Loss"],
  ["ORIENTITIS", "Orientitis"],
  ["HUNTINGTONS_DISEASE", "Huntington’s disease"],
] as const;

export const DR_DOCTOR_SYMPTOMS = [
  ["BLOATING", "Bloating"],
  ["CHILLS", "Chills"],
  ["COLD_HANDS", "Cold Hands"],
  ["CONSTIPATION", "Constipation"],
  ["COUGH", "Cough"],
  ["DIARRHEA", "Diarrhea"],
  ["DISAPPEARANCE_OF_THE_EARS", "Disappearance of the Ears"],
  ["DIZZINESS", "Dizziness"],
  ["EXCESSIVE_CRYING", "Excessive Crying"],
  ["FATIGUE", "Fatigue"],
  ["FEVER", "Fever"],
  ["FOOT_SWELLING", "Foot swelling"],
  ["GAS", "Gas"],
  ["HALLUCINATION", "Hallucination"],
  ["HEADACHE", "Headache"],
  ["LOSS_OF_SMELL", "Loss of Smell"],
  ["MUSCLE_CRAMP", "Muscle Cramp"],
  ["NAUSEA", "Nausea"],
  ["NUMBNESS", "Numbness"],
  ["SHORTNESS_OF_BREATH", "Shortness of Breath"],
  ["SLEEPINESS", "Sleepiness"],
  ["THIRSTINESS", "Thirstiness"],
  ["THROAT_IRRITATION", "Throat irritation"],
] as const;

export type DrDoctorDisease = typeof DR_DOCTOR_DISEASES[number][0];
export type DrDoctorSymptom = typeof DR_DOCTOR_SYMPTOMS[number][0];

export interface DrDoctorInput {
  diagnoses: DrDoctorDisease[];
  symptoms: DrDoctorSymptom[];
  moreThanHalfTimeRemaining: boolean;
  displayedSymptom: DrDoctorSymptom;
}

export interface DrDoctorOutput {
  diagnosis: string;
  treatment: string;
  dose: string;
  followUpDay: number;
  followUpMonth: number;
}

export const solveDrDoctor = (roundId: string, bombId: string, moduleId: string, input: DrDoctorInput) =>
  solveModule<DrDoctorInput, { output: DrDoctorOutput }>(roundId, bombId, moduleId, input);
