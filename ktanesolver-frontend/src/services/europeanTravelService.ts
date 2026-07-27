import { solveModule } from "../lib/api";

export interface EuropeanTravelInput {
  country: string;
  ticketSerial: string;
}

export interface EuropeanTravelOutput {
  ticketType: "SGL" | "RTN";
  travelClass: "1st class" | "2nd class";
  departure: string;
  destination: string;
  seat: string;
  price: string;
}

export const solveEuropeanTravel = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: EuropeanTravelInput,
) => solveModule<EuropeanTravelInput, { output: EuropeanTravelOutput; solved: boolean }>(
  roundId, bombId, moduleId, input,
);
