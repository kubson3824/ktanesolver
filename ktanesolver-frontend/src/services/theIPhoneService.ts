import { api, withErrorWrapping } from "../lib/api";

export type IPhoneAction = "ANGRY_BIRDS" | "MESSAGES" | "PHOTOS" | "TINDER" | "RECORD_DIGIT" | "RESET_TINDER" | "CHEAT_CODES";
export type IPhonePerson = "PHIL" | "ROB" | "MICK" | "ANDY";
export interface IPhoneMessage { sender: IPhonePerson; style: IPhonePerson; digit: number }
export interface TinderProfile { name: string; age: number; starSign: string; hobby: string; pet: string }
export interface TheIPhoneInput {
  action: IPhoneAction;
  characters?: string[];
  messages?: IPhoneMessage[];
  photoDigit?: number;
  tinder?: TinderProfile;
  pinPosition?: number;
  pinDigit?: number;
}
export interface TheIPhoneOutput {
  instruction: string;
  pinDigits: Array<number | null>;
  pressPosition: string | null;
  swipeDirection: string | null;
  matchScore: number | null;
  tinderProgress: number;
  pin: string | null;
  cheatCodes: Record<string, string>;
}

export const solveTheIPhone = async (roundId: string, bombId: string, moduleId: string, input: TheIPhoneInput) =>
  withErrorWrapping(async () => (await api.post<{ output: TheIPhoneOutput; solved: boolean }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
