import { api, withErrorWrapping } from "../lib/api";

export type FizzBuzzColor = "RED" | "GREEN" | "BLUE" | "YELLOW" | "WHITE";
export type FizzBuzzAction = "NUMBER" | "FIZZ" | "BUZZ" | "FIZZBUZZ";
export interface FizzBuzzDisplay { number: string; color: FizzBuzzColor }
export interface FizzBuzzInput { displays: FizzBuzzDisplay[] }
export interface FizzBuzzOutput { actions: FizzBuzzAction[] }

export const solveFizzBuzz = async (roundId: string, bombId: string, moduleId: string, input: FizzBuzzInput) =>
  withErrorWrapping(async () => (await api.post<{ output: FizzBuzzOutput }>(
    `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`, { input },
  )).data);
